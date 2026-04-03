// server/src/services/xrpl.ts
import { Client, Wallet, convertStringToHex } from 'xrpl'
import { db } from '../lib/db'
import { incrementNetTen } from '../xrpl/handlers/netTen'

const RLUSD_ISSUER   = process.env.RLUSD_ISSUER_ADDRESS || 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const RLUSD_CURRENCY = 'USD'

class XRPLService {
  private client: Client
  private wallet: Wallet | null = null
  private subscribedAddresses = new Set<string>()

  constructor() {
    this.client = new Client(process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233')
  }

  async connect() {
    await this.client.connect()
    if (process.env.XRPL_PLATFORM_WALLET_SEED) {
      this.wallet = Wallet.fromSeed(process.env.XRPL_PLATFORM_WALLET_SEED)
    }
  }

  async subscribeMerchantWallet(merchantId: string, address: string): Promise<void> {
    if (this.subscribedAddresses.has(address)) return

    await this.client.request({ command: 'subscribe', accounts: [address] })
    this.subscribedAddresses.add(address)

    this.client.on('transaction', async (tx: any) => {
      try {
        if (tx.transaction?.TransactionType !== 'Payment') return
        if (tx.transaction?.Destination !== address) return
        if (tx.meta?.TransactionResult !== 'tesSUCCESS') return

        const raw      = tx.transaction.Amount
        const isXRP    = typeof raw === 'string'
        const currency = isXRP ? 'XRP' : raw.currency
        const value    = isXRP ? (parseInt(raw, 10) / 1_000_000).toFixed(6) : raw.value
        const txHash   = tx.transaction.hash

        console.log(`[xrpl] ✓ Payment — merchantId=${merchantId} ${value} ${currency} hash=${txHash?.slice(0,16)}...`)

        // Mark most recent PENDING transaction as COMPLETED
        const pending = await db.transaction.findFirst({
          where:   { merchantId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        })
        if (pending) {
          await db.transaction.update({
            where: { id: pending.id },
            data:  { status: 'COMPLETED', xrplTxHash: txHash, updatedAt: new Date() },
          })
          console.log(`[xrpl] Transaction COMPLETED — id=${pending.id}`)
        }

        // 🔥 Fire Net Ten on every confirmed incoming payment
        await incrementNetTen(merchantId)

      } catch (err) {
        console.error('[xrpl] Error handling transaction:', err)
      }
    })

    console.log(`[xrpl] ✓ Subscribed — ${address} (merchantId=${merchantId})`)
  }

  async subscribeAllMerchantWallets(): Promise<void> {
    const merchants = await db.merchant.findMany({
      where:  { xrplAddress: { not: null }, isActive: true },
      select: { id: true, xrplAddress: true },
    })
    if (!merchants.length) { console.log('[xrpl] No merchant wallets yet'); return }
    console.log(`[xrpl] Subscribing to ${merchants.length} merchant wallet(s)...`)
    for (const m of merchants) {
      if (m.xrplAddress) await this.subscribeMerchantWallet(m.id, m.xrplAddress)
    }
    console.log('[xrpl] ✓ All merchant wallets live — Net Ten armed')
  }

  async sendRLUSD(params: { destination: string; amount: number; memo?: string }) {
    if (!this.client.isConnected()) await this.connect()
    if (!this.wallet) throw new Error('Platform wallet not configured')
    const payment: any = {
      TransactionType: 'Payment',
      Account:         this.wallet.address,
      Destination:     params.destination,
      Amount: { currency: RLUSD_CURRENCY, value: params.amount.toFixed(6), issuer: RLUSD_ISSUER },
      Memos: params.memo ? [{ Memo: { MemoData: convertStringToHex(params.memo) } }] : undefined,
    }
    return this.client.submitAndWait(payment, { wallet: this.wallet })
  }

  async monitorAddress(address: string, onPayment: (tx: any) => void) {
    await this.client.request({ command: 'subscribe', accounts: [address] })
    this.client.on('transaction', (tx: any) => {
      if (tx.transaction.Destination === address) onPayment(tx)
    })
  }

  isConnected() { return this.client.isConnected() }
}

export const xrplService = new XRPLService()
