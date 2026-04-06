/**
 * @file netTen.ts
 * @description Net Ten reward engine — Netten's core merchant loyalty mechanism.
 *
 * Reward Levels (tenure-based, not calendar-based):
 *   Every merchant starts at Level 1 on their first day.
 *   Advancing requires BOTH time on Netten AND minimum lifetime transactions.
 *
 *   Level 1  $0.25 RLUSD  Default — day one, no threshold
 *   Level 2  $0.50 RLUSD  3+ months + 30+ lifetime txns
 *   Level 3  $1.00 RLUSD  6+ months + 60+ lifetime txns
 *   Level 4  $2.00 RLUSD  9+ months + 90+ lifetime txns
 *
 * Why tenure-based?
 *   Calendar quarters are unfair — a merchant joining in October would
 *   immediately earn at $2.00 Q4 rate while a January merchant starts at $0.25.
 *   Tenure-based levels ensure every merchant has the same journey regardless
 *   of when they signed up.
 *
 * How rewards fire:
 *   Every confirmed XRPL payment increments the merchant counter.
 *   Every 10th transaction triggers an immediate RLUSD reward at their current level.
 *   When both time + txn thresholds are crossed, the merchant levels up and
 *   receives an email notification.
 */

import { db }              from '../../lib/db'
import { sendRLUSDReward } from '../xrplService'
import { Resend }          from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Level Configuration ────────────────────────────────────────────────────

interface RewardLevel {
  level:       number
  rate:        number   // RLUSD per milestone
  monthsMin:   number   // months on Netten required
  txnsMin:     number   // lifetime txns required
  label:       string
}

const REWARD_LEVELS: RewardLevel[] = [
  { level: 1, rate: 0.25, monthsMin: 0, txnsMin:  0, label: 'Level 1' },
  { level: 2, rate: 0.50, monthsMin: 3, txnsMin: 30, label: 'Level 2' },
  { level: 3, rate: 1.00, monthsMin: 6, txnsMin: 60, label: 'Level 3' },
  { level: 4, rate: 2.00, monthsMin: 9, txnsMin: 90, label: 'Level 4' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the number of full months between two dates.
 */
function monthsSince(date: Date): number {
  const now   = new Date()
  const years = now.getFullYear() - date.getFullYear()
  const months = now.getMonth() - date.getMonth()
  return Math.max(0, years * 12 + months)
}

/**
 * Determines the current reward level for a merchant based on their
 * tenure (months since createdAt) and lifetime transaction count.
 * Both thresholds must be met to advance to the next level.
 */
function getMerchantLevel(createdAt: Date, lifetimeTxns: number): RewardLevel {
  const tenure = monthsSince(createdAt)
  // Walk levels in reverse — return highest level both conditions satisfy
  for (let i = REWARD_LEVELS.length - 1; i >= 0; i--) {
    const lvl = REWARD_LEVELS[i]
    if (tenure >= lvl.monthsMin && lifetimeTxns >= lvl.txnsMin) {
      return lvl
    }
  }
  return REWARD_LEVELS[0]
}

/**
 * Checks whether a merchant has just unlocked a new level with this transaction,
 * and if so sends them a congratulatory email.
 */
async function checkAndNotifyLevelUp(
  merchantId:   string,
  email:        string,
  businessName: string,
  createdAt:    Date,
  newTxnCount:  number,
  previousRate: number,
): Promise<void> {
  const newLevel = getMerchantLevel(createdAt, newTxnCount)

  // No level up if rate hasn't changed
  if (newLevel.rate <= previousRate) return

  console.log(
    `[netTen] 🚀 Level up! merchantId=${merchantId} ` +
    `${previousRate} → ${newLevel.rate} RLUSD/milestone`,
  )

  // Persist the level-up event
  await db.rewardEvent.create({
    data: {
      merchantId,
      type:        'LEVEL_UP',
      amountRlusd: 0,
      description: `Unlocked ${newLevel.label} — $${newLevel.rate} RLUSD per milestone`,
    },
  })

  // Send email notification
  try {
    await resend.emails.send({
      from:    'Netten <noreply@netten.app>',
      to:      email,
      subject: `🎉 You've unlocked a new Net Ten rate — $${newLevel.rate} RLUSD per milestone`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a1a0f;color:#fff;border-radius:16px;">
          <div style="margin-bottom:24px;">
            <span style="background:#1d9e75;color:#fff;font-weight:700;padding:4px 12px;border-radius:8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Net Ten Update</span>
          </div>
          <h1 style="color:#00ff88;font-size:28px;margin:0 0 8px;">You levelled up! 🚀</h1>
          <p style="color:#9ca3af;font-size:16px;margin:0 0 24px;">Hi ${businessName || email.split('@')[0]},</p>
          <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your loyalty is paying off. You've unlocked <strong style="color:#00ff88;">${newLevel.label}</strong> —
            your Net Ten reward rate has increased to
            <strong style="color:#00ff88;">$${newLevel.rate} RLUSD</strong> per milestone.
          </p>
          <div style="background:#1a2e1f;border:1px solid #1d9e75;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Your new rate</p>
            <p style="color:#00ff88;font-size:32px;font-weight:700;margin:0;">\$${newLevel.rate} RLUSD</p>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">per every 10 transactions</p>
          </div>
          <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Every 10 payments you process from now on will earn you
            <strong>$${newLevel.rate} RLUSD</strong> deposited directly to your wallet. Keep going!
          </p>
          <a href="https://www.netten.app/dashboard/rewards" style="display:inline-block;background:#1d9e75;color:#fff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;">View Rewards Dashboard →</a>
          <p style="color:#4b5563;font-size:12px;margin:32px 0 0;">Netten · netten.app</p>
        </div>
      `,
    })
    console.log(`[netTen] Level-up email sent to ${email}`)
  } catch (err) {
    console.error('[netTen] Level-up email failed:', err)
  }
}

// ── Core Function ──────────────────────────────────────────────────────────

/**
 * Increments a merchant's Net Ten counter and fires a reward if the updated
 * count is a multiple of 10. Reward rate is based on merchant tenure + txn count.
 *
 * @param merchantId - Netten internal merchant UUID.
 */
export async function incrementNetTen(merchantId: string): Promise<void> {
  // Fetch merchant for tenure calculation and email notification
  const merchant = await db.merchant.findUnique({
    where:  { id: merchantId },
    select: { createdAt: true, email: true, businessName: true, rewardBalance: true, totalRewardsEarned: true },
  })

  if (!merchant) {
    console.warn(`[netTen] Merchant not found: ${merchantId}`)
    return
  }

  // Atomically upsert the counter
  const counter = await db.netTenCounter.upsert({
    where:  { merchantId },
    create: { merchantId, totalCount: 1, currentQuarter: 1, rewardAmount: 0.25 },
    update: { totalCount: { increment: 1 } },
  })

  const count        = counter.totalCount
  const previousRate = counter.rewardAmount ?? 0.25
  const currentLevel = getMerchantLevel(merchant.createdAt, count)
  const rewardAmount = currentLevel.rate

  console.log(
    `[netTen] Counter updated — merchantId=${merchantId} ` +
    `count=${count} level=${currentLevel.level} rate=$${rewardAmount}`,
  )

  // Check for level up (runs on every txn — cheap because it's just math)
  await checkAndNotifyLevelUp(
    merchantId,
    merchant.email,
    merchant.businessName ?? '',
    merchant.createdAt,
    count,
    Number(previousRate),
  )

  // ── Milestone check — every 10th transaction ─────────────────────────────
  if (count % 10 !== 0) return

  console.log(
    `[netTen] 🎯 Milestone! merchantId=${merchantId} ` +
    `count=${count} level=${currentLevel.level} reward=$${rewardAmount} RLUSD`,
  )

  // Disburse reward immediately
  await sendRLUSDReward(merchantId, rewardAmount)

  // Persist milestone event
  await db.rewardEvent.create({
    data: {
      merchantId,
      type:        'TXN_MILESTONE',
      amountRlusd: rewardAmount,
      description: `Net Ten ${currentLevel.label} reward — transaction #${count}`,
    },
  })

  // Update merchant balances
  await db.merchant.update({
    where: { id: merchantId },
    data: {
      rewardBalance:      { increment: rewardAmount },
      totalRewardsEarned: { increment: rewardAmount },
    },
  })

  // Sync counter to current level
  await db.netTenCounter.update({
    where: { merchantId },
    data: {
      currentQuarter: currentLevel.level,
      rewardAmount,
      lastRewardDate: new Date(),
    },
  })

  console.log(
    `[netTen] ✓ Reward disbursed — merchantId=${merchantId} ` +
    `$${rewardAmount} RLUSD (${currentLevel.label})`,
  )
}

// ── Export level config for frontend use ──────────────────────────────────
export { REWARD_LEVELS, getMerchantLevel, monthsSince }
