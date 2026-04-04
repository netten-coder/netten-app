/**
 * @file xrpl.ts
 * @description XRP Ledger service — manages the persistent WebSocket connection,
 * merchant wallet subscriptions, and RLUSD reward disbursements.
 *
 * Architecture:
 *   - Single shared Client instance across the application lifetime
 *   - Per-address event listeners with deduplication via subscribedAddresses Set
 *   - All incoming payments are routed through incrementNetTen for reward tracking
 *   - RLUSD is sent as an IOU (issued currency) on the XRP Ledger, not as XRP drops
 */

import { Client, Wallet, convertStringToHex, type TxResponse } from 'xrpl'
import { db } from '../lib/db'
import { incrementNetTen } from '../xrpl/handlers/netTen'

// ── Constants ──────────────────────────────────────────────────────────────

/** RLUSD issuer address on mainnet. Falls back to testnet genesis for local dev. */
const RLUSD_ISSUER   = process.env.RLUSD_ISSUER_ADDRESS ?? 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'

/** ISO 4217 currency code used by RLUSD on the XRP Ledger. */
const RLUSD_CURRENCY = 'USD'

/** XRP drops per whole XRP unit (1 XRP = 1,000,000 drops). */
const DROPS_PER_XRP  = 1_000_000

// ── Types ──────────────────────────────────────────────────────────────────

interface SendRLUSDParams {
  /** Destination XRPL wallet address (r-address). */
  destination: string
  /** Amount in RLUSD (e.g. 0.25 for a Q1 Net Ten reward). */
  amount:      number
  /** Optional UTF-8 memo to attach to the on-chain transaction. */
  memo?:       string
}

// ── Service ────────────────────────────────────────────────────────────────

class XRPLService {
  private readonly client:              Client
  private          wallet:              Wallet | null = null
  private readonly subscribedAddresses: Set<string>  = new Set()

  constructor() {
    this.client = new Client(
      process.env.XRPL_NODE_URL ?? 'wss://s.altnet.rippletest.net:51233',
    )
  }

  // ── Connection ───────────────────────────────────────────────────────────

  /**
   * Establishes a WebSocket connection to the XRP Ledger node and
   * initialises the platform wallet used for sending RLUSD rewards.
   *
   * Called once at server startup before any subscription logic runs.
   */
  async connect(): Promise<void> {
    await this.client.connect()

    if (process.env.XRPL_PLATFORM_WALLET_SEED) {
      this.wallet = Wallet.fromSeed(process.env.XRPL_PLATFORM_WALLET_SEED)
      console.log(`[xrpl] Platform wallet ready — ${this.wallet.address}`)
    } else {
      console.warn('[xrpl] XRPL_PLATFORM_WALLET_SEED not set — reward disbursement disabled')
    }
  }

  // ── Merchant Wallet Subscriptions ────────────────────────────────────────

  /**
   * Subscribes to incoming XRP Ledger transactions for a single merchant wallet.
   * Idempotent — calling multiple times with the same address is safe.
   *
   * On each confirmed incoming payment:
   *   1. The corresponding PENDING transaction record is marked COMPLETED.
   *   2. incrementNetTen fires, advancing the merchant's reward counter.
   *
   * @param merchantId - Netten internal merchant UUID.
   * @param address    - XRPL r-address to monitor (e.g. rXXX...).
   */
  async subscribeMerchantWallet(merchantId: string, address: string): Promise<void> {
    if (this.subscribedAddresses.has(address)) {
      console.log(`[xrpl] Already subscribed to ${address} — skipping`)
      return
    }

    await this.client.request({ command: 'subscribe', accounts: [address] })
    this.subscribedAddresses.add(address)

    this.client.on('transaction', async (tx: any) => {
      try {
        await this.handleIncomingPayment(tx, merchantId, address)
      } catch (err) {
        console.error(`[xrpl] Error handling transaction for ${address}:`, err)
      }
    })

    console.log(`[xrpl] ✓ Subscribed — ${address} (merchantId=${merchantId})`)
  }

  /**
   * Subscribes to all active merchants that have an XRPL address configured.
   * Runs once at server boot to ensure no payments are missed after a restart.
   */
  async subscribeAllMerchantWallets(): Promise<void> {
    const merchants = await db.merchant.findMany({
      where:  { xrplAddress: { not: null }, isActive: true },
      select: { id: true, xrplAddress: true },
    })

    if (!merchants.length) {
      console.log('[xrpl] No merchant wallets configured — skipping subscription')
      return
    }

    console.log(`[xrpl] Subscribing to ${merchants.length} merchant wallet(s)...`)

    for (const merchant of merchants) {
      if (merchant.xrplAddress) {
        await this.subscribeMerchantWallet(merchant.id, merchant.xrplAddress)
      }
    }

    console.log('[xrpl] ✓ All merchant wallets live — Net Ten armed')
  }

  // ── RLUSD Disbursement ───────────────────────────────────────────────────

  /**
   * Sends RLUSD (as an XRP Ledger IOU) from the platform wallet to a recipient.
   * Used exclusively for Net Ten reward disbursements.
   *
   * Reconnects automatically if the WebSocket connection has dropped.
   *
   * @param params - Destination address, amount in RLUSD, and optional memo.
   * @returns      - The finalised ledger transaction response.
   * @throws       - If the platform wallet seed is not configured.
   */
  async sendRLUSD(params: SendRLUSDParams): Promise<TxResponse> {
    if (!this.client.isConnected()) {
      console.warn('[xrpl] Client disconnected — reconnecting before send')
      await this.connect()
    }

    if (!this.wallet) {
      throw new Error('[xrpl] Platform wallet not configured — set XRPL_PLATFORM_WALLET_SEED')
    }

    const payment = {
      TransactionType: 'Payment' as const,
      Account:         this.wallet.address,
      Destination:     params.destination,
      Amount: {
        currency: RLUSD_CURRENCY,
        value:    params.amount.toFixed(6),
        issuer:   RLUSD_ISSUER,
      },
      ...(params.memo && {
        Memos: [{ Memo: { MemoData: convertStringToHex(params.memo) } }],
      }),
    }

    return this.client.submitAndWait(payment, { wallet: this.wallet })
  }

  // ── Utilities ────────────────────────────────────────────────────────────

  /** Returns true when the WebSocket connection to the XRPL node is active. */
  isConnected(): boolean {
    return this.client.isConnected()
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Processes a raw XRPL transaction event, filtering for confirmed incoming
   * payments to the subscribed merchant address and triggering downstream logic.
   *
   * @param tx         - Raw transaction object emitted by the XRPL WebSocket.
   * @param merchantId - Merchant to credit.
   * @param address    - Expected destination address (guard against cross-listener events).
   */
  private async handleIncomingPayment(
    tx:         any,
    merchantId: string,
    address:    string,
  ): Promise<void> {
    if (tx.transaction?.TransactionType !== 'Payment')      return
    if (tx.transaction?.Destination     !== address)        return
    if (tx.meta?.TransactionResult      !== 'tesSUCCESS')   return

    const raw      = tx.transaction.Amount
    const isXRP    = typeof raw === 'string'
    const currency = isXRP ? 'XRP' : (raw as any).currency
    const value    = isXRP
      ? (parseInt(raw, 10) / DROPS_PER_XRP).toFixed(6)
      : (raw as any).value
    const txHash   = tx.transaction.hash as string | undefined

    console.log(
      `[xrpl] ✓ Payment confirmed — merchantId=${merchantId} ` +
      `amount=${value} ${currency} hash=${txHash?.slice(0, 16)}...`,
    )

    // Mark the most recent PENDING transaction record as COMPLETED
    const pending = await db.transaction.findFirst({
      where:   { merchantId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })

    if (pending) {
      await db.transaction.update({
        where: { id: pending.id },
        data:  { status: 'COMPLETED', xrplTxHash: txHash, updatedAt: new Date() },
      })
      console.log(`[xrpl] Transaction marked COMPLETED — id=${pending.id}`)
    }

    // Advance the merchant's Net Ten counter and fire a reward if due
    await incrementNetTen(merchantId)
  }
}

// ── Singleton export ───────────────────────────────────────────────────────

/**
 * Shared XRPLService instance.
 * Imported by server/src/index.ts (boot), merchant routes (live subscriptions),
 * and the rewards service (RLUSD disbursement).
 */
export const xrplService = new XRPLService()
