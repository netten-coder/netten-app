/**
 * @file rewardsSweep.ts
 * @description Automated RLUSD sweep from Fee Collection wallet to Platform/Rewards wallet.
 *
 * How it works:
 *   1. Checks the Fee Collection wallet RLUSD balance via XRPL
 *   2. Keeps a minimum reserve in the fee wallet (default: $10 RLUSD)
 *   3. Sweeps a configurable percentage of the surplus to the Platform wallet
 *   4. Logs every sweep as an internal event for accounting
 *
 * Schedule: Runs every Sunday at midnight UTC (weekly sweep)
 *
 * Self-sustaining math:
 *   At 100 merchants × 10 txns × $100 avg = $200 fee revenue/month
 *   20% sweep weekly = ~$10/week into rewards pool
 *   Net Ten costs at Q1 rate = ~$2.50/month
 *   Pool grows 4x faster than it pays out from day one
 */

import { Client, Wallet, convertStringToHex } from 'xrpl'
import { db }                                   from '../lib/db'

// ── Configuration ──────────────────────────────────────────────────────────

/** Percentage of surplus RLUSD to sweep into the rewards pool each run. */
const SWEEP_PERCENTAGE = 0.20

/** Minimum RLUSD to always keep in the Fee Collection wallet as reserve. */
const MIN_FEE_RESERVE_RLUSD = 10

/** RLUSD currency hex code on the XRP Ledger mainnet. */
const RLUSD_CURRENCY = '524C555344000000000000000000000000000000'

/** Official Ripple RLUSD issuer address on mainnet. */
const RLUSD_ISSUER = process.env.RLUSD_ISSUER_ADDRESS ?? 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De'

// ── Main sweep function ────────────────────────────────────────────────────

/**
 * Sweeps surplus RLUSD from the Fee Collection wallet into the Platform/Rewards wallet.
 * Safe to call multiple times — will no-op if balance is at or below the minimum reserve.
 */
export async function sweepFeesToRewardsPool(): Promise<void> {
  const feeWalletAddress      = process.env.FEE_WALLET_ADDRESS
  const feeWalletSeed         = process.env.FEE_WALLET_SEED
  const platformWalletAddress = process.env.XRPL_PLATFORM_WALLET_ADDRESS
  const nodeUrl               = process.env.XRPL_NODE_URL ?? 'wss://xrplcluster.com'

  if (!feeWalletSeed) {
    console.warn('[sweep] FEE_WALLET_SEED not set — skipping rewards sweep')
    return
  }

  if (!feeWalletAddress || !platformWalletAddress) {
    console.warn('[sweep] Wallet addresses not configured — skipping rewards sweep')
    return
  }

  const client = new Client(nodeUrl)

  try {
    await client.connect()
    console.log('[sweep] Connected to XRPL mainnet')

    // ── Check fee wallet RLUSD balance ─────────────────────────────────────
    const accountLines = await client.request({
      command:  'account_lines',
      account:  feeWalletAddress,
      peer:     RLUSD_ISSUER,
    })

    const rlusdLine = (accountLines.result.lines as any[]).find(
      (line: any) => line.currency === RLUSD_CURRENCY,
    )

    const balance = parseFloat(rlusdLine?.balance ?? '0')

    console.log(`[sweep] Fee wallet RLUSD balance: $${balance.toFixed(6)}`)

    // ── Calculate sweep amount ─────────────────────────────────────────────
    const surplus     = Math.max(0, balance - MIN_FEE_RESERVE_RLUSD)
    const sweepAmount = parseFloat((surplus * SWEEP_PERCENTAGE).toFixed(6))

    if (sweepAmount < 0.01) {
      console.log(`[sweep] Surplus too small ($${surplus.toFixed(2)}) — skipping sweep`)
      await client.disconnect()
      return
    }

    console.log(
      `[sweep] Sweeping $${sweepAmount} RLUSD ` +
      `(${SWEEP_PERCENTAGE * 100}% of $${surplus.toFixed(2)} surplus) ` +
      `→ Platform wallet`,
    )

    // ── Execute the sweep payment ──────────────────────────────────────────
    const feeWallet = Wallet.fromSeed(feeWalletSeed)

    const tx = {
      TransactionType: 'Payment' as const,
      Account:         feeWallet.address,
      Destination:     platformWalletAddress,
      Amount: {
        currency: RLUSD_CURRENCY,
        value:    sweepAmount.toFixed(6),
        issuer:   RLUSD_ISSUER,
      },
      Memos: [{
        Memo: {
          MemoData: convertStringToHex(
            `Netten weekly rewards sweep — $${sweepAmount.toFixed(2)} RLUSD`,
          ),
        },
      }],
    }

    const result = await client.submitAndWait(tx, { wallet: feeWallet })
    const status = (result.result.meta as any)?.TransactionResult

    if (status === 'tesSUCCESS') {
      console.log(`[sweep] ✓ Sweep successful — $${sweepAmount.toFixed(2)} RLUSD → Platform wallet`)

      // Log internally for accounting
      await db.rewardEvent.create({
        data: {
          merchantId:  'netten-internal',
          type:        'SWEEP',
          amountRlusd: sweepAmount,
          description: `Weekly fee sweep — $${sweepAmount.toFixed(2)} RLUSD moved to rewards pool`,
        },
      }).catch(() => {
        // Non-fatal — sweep succeeded, just log the warning
        console.warn('[sweep] Could not create internal RewardEvent — DB schema may need SWEEP type')
      })
    } else {
      console.error(`[sweep] Sweep failed — ${status}`)
    }

  } catch (err) {
    console.error('[sweep] Unexpected error during rewards sweep:', err)
  } finally {
    if (client.isConnected()) await client.disconnect()
  }
}
