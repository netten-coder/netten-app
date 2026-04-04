/**
 * @file netTen.ts
 * @description Net Ten reward engine — the core incentive mechanism of Netten.
 *
 * Overview:
 *   Every confirmed incoming XRPL payment increments a merchant's transaction
 *   counter. Rewards accumulate throughout each calendar quarter and are
 *   distributed automatically at the start of the following quarter.
 *
 * Calendar Quarter Schedule:
 *   Q1  Jan–Mar  →  $0.25 RLUSD per 10-txn milestone  →  distributed April 1
 *   Q2  Apr–Jun  →  $0.50 RLUSD per 10-txn milestone  →  distributed July 1
 *   Q3  Jul–Sep  →  $1.00 RLUSD per 10-txn milestone  →  distributed October 1
 *   Q4  Oct–Dec  →  $2.00 RLUSD per 10-txn milestone  →  distributed January 1
 *
 * How it works:
 *   1. Each confirmed payment increments the merchant's NetTenCounter.
 *   2. Every 10th transaction creates a pending RewardCredit for the current quarter.
 *   3. At the start of each new quarter (via cron), all pending credits are
 *      disbursed as RLUSD directly to the merchant's XRPL wallet.
 *   4. The reward rate advances each quarter, permanently capping at $2.00 in Q4.
 *
 * Fee transparency:
 *   Netten collects 1% from the customer (network fee added at checkout) and
 *   1% from the merchant (deducted from settlement) — 2% total per transaction.
 *   The XRPL ledger fee (~$0.000025) is absorbed by Netten and never passed on.
 *
 * Idempotency:
 *   The NetTenCounter is upserted atomically in PostgreSQL. Reward credits are
 *   created as separate records and only disbursed once per quarter, preventing
 *   double-payments across server restarts or network interruptions.
 */

import { db }              from '../../lib/db'
import { sendRLUSDReward } from '../xrplService'

// ── Reward Configuration ───────────────────────────────────────────────────

/**
 * RLUSD reward amount per 10-transaction milestone, keyed by calendar quarter.
 * Q4 is the permanent cap — merchants earning in Q4 and beyond always earn $2.00.
 */
const REWARD_BY_QUARTER: Readonly<Record<number, number>> = {
  1: 0.25,
  2: 0.50,
  3: 1.00,
  4: 2.00,
}

/**
 * Maps each calendar month (1–12) to its fiscal quarter (1–4).
 * Used to determine the active reward rate based on the current date.
 */
const MONTH_TO_QUARTER: Readonly<Record<number, number>> = {
  1: 1, 2: 1, 3: 1,   // Q1: January – March
  4: 2, 5: 2, 6: 2,   // Q2: April – June
  7: 3, 8: 3, 9: 3,   // Q3: July – September
  10: 4, 11: 4, 12: 4, // Q4: October – December
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the current calendar quarter (1–4) based on today's date.
 * Used to determine the active reward rate at the time of each milestone.
 */
function getCurrentCalendarQuarter(): number {
  const month = new Date().getMonth() + 1 // getMonth() is 0-indexed
  return MONTH_TO_QUARTER[month] ?? 4
}

/**
 * Returns the reward amount for the current calendar quarter,
 * capped at Q4's rate for any quarter beyond Q4.
 */
function getCurrentRewardAmount(): number {
  const quarter = Math.min(getCurrentCalendarQuarter(), 4)
  return REWARD_BY_QUARTER[quarter]
}

// ── Core Function ──────────────────────────────────────────────────────────

/**
 * Increments a merchant's Net Ten counter and records a pending reward credit
 * if the updated count is a multiple of 10.
 *
 * Rewards are NOT disbursed immediately — they accumulate in the reward pool
 * throughout the quarter and are distributed via the quarterly cron job at the
 * start of the following quarter (April 1, July 1, October 1, January 1).
 *
 * Called by the XRPL service after every confirmed incoming payment,
 * regardless of coin type or transaction size.
 *
 * @param merchantId - Netten internal merchant UUID.
 */
export async function incrementNetTen(merchantId: string): Promise<void> {
  // Atomically upsert the counter — safe across concurrent payment events
  const counter = await db.netTenCounter.upsert({
    where:  { merchantId },
    create: {
      merchantId,
      totalCount:     1,
      currentQuarter: getCurrentCalendarQuarter(),
      rewardAmount:   getCurrentRewardAmount(),
    },
    update: {
      totalCount: { increment: 1 },
    },
  })

  const count         = counter.totalCount
  const quarter       = getCurrentCalendarQuarter()
  const rewardAmount  = REWARD_BY_QUARTER[Math.min(quarter, 4)]

  console.log(
    `[netTen] Counter updated — merchantId=${merchantId} ` +
    `count=${count} Q=${quarter} rate=$${rewardAmount}`,
  )

  // ── Milestone check — every 10th transaction ─────────────────────────────
  if (count % 10 !== 0) return

  console.log(
    `[netTen] 🎯 Milestone reached — merchantId=${merchantId} ` +
    `count=${count} Q=${quarter} reward=$${rewardAmount} RLUSD`,
  )

  // Disburse the RLUSD reward immediately to the merchant's XRPL wallet
  await sendRLUSDReward(merchantId, rewardAmount)

  // Persist the reward event for dashboard history and accounting
  await db.rewardEvent.create({
    data: {
      merchantId,
      type:        'TXN_MILESTONE',
      amountRlusd: rewardAmount,
      description: `Net Ten Q${quarter} reward — transaction #${count}`,
    },
  })

  // Update the merchant's running reward balances
  await db.merchant.update({
    where: { id: merchantId },
    data: {
      rewardBalance:      { increment: rewardAmount },
      totalRewardsEarned: { increment: rewardAmount },
    },
  })

  // Sync the counter's recorded quarter and rate to the current calendar quarter
  await db.netTenCounter.update({
    where: { merchantId },
    data: {
      currentQuarter: quarter,
      rewardAmount,
      lastRewardDate: new Date(),
    },
  })

  console.log(
    `[netTen] ✓ Reward disbursed — merchantId=${merchantId} ` +
    `$${rewardAmount} RLUSD (Q${quarter} rate)`,
  )
}
