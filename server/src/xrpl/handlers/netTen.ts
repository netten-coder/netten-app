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
 * Referral Rewards:
 *   When a referred merchant completes their 5th transaction:
 *   - Referrer gets $10 RLUSD
 *   - Referred merchant gets $10 RLUSD
 *   Both parties must have XRPL addresses configured.
 */

import { db }              from '../../lib/db'
import { sendRLUSDReward } from '../xrplService'
import { Resend }          from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ── Constants ──────────────────────────────────────────────────────────────

const REFERRAL_REWARD_AMOUNT = 10        // $10 RLUSD for both parties
const REFERRAL_TXN_THRESHOLD = 5         // Fires after 5 transactions

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

function monthsSince(date: Date): number {
  const now   = new Date()
  const years = now.getFullYear() - date.getFullYear()
  const months = now.getMonth() - date.getMonth()
  return Math.max(0, years * 12 + months)
}

function getMerchantLevel(createdAt: Date, lifetimeTxns: number): RewardLevel {
  const tenure = monthsSince(createdAt)
  for (let i = REWARD_LEVELS.length - 1; i >= 0; i--) {
    const lvl = REWARD_LEVELS[i]
    if (tenure >= lvl.monthsMin && lifetimeTxns >= lvl.txnsMin) {
      return lvl
    }
  }
  return REWARD_LEVELS[0]
}

// ── Referral Reward Logic ──────────────────────────────────────────────────

/**
 * Checks if a referred merchant has hit 5 transactions and fires rewards
 * to BOTH the referrer and the referred merchant ($10 RLUSD each).
 * 
 * Only fires once — guarded by referralRewardPaid flag.
 */
async function checkAndFireReferralReward(
  merchantId: string,
  txnCount:   number,
): Promise<void> {
  // Only check at exactly 5 transactions
  if (txnCount !== REFERRAL_TXN_THRESHOLD) return

  // Get merchant with referral info
  const merchant = await db.merchant.findUnique({
    where: { id: merchantId },
    select: { 
      id: true,
      email: true,
      businessName: true,
      xrplAddress: true,
      referredBy: true, 
      referralRewardPaid: true,
    },
  })

  // Guard: no referral or already paid
  if (!merchant?.referredBy || merchant.referralRewardPaid) return

  // Find the referrer by their referral code
  const referrer = await db.merchant.findFirst({
    where: { referralCode: merchant.referredBy },
    select: { id: true, xrplAddress: true, email: true, businessName: true },
  })

  if (!referrer) {
    console.warn(`[referral] Referrer not found for code: ${merchant.referredBy}`)
    return
  }

  console.log(
    `[referral] 🎁 Referral threshold reached! ` +
    `referred=${merchantId} referrer=${referrer.id}`
  )

  // Mark as paid FIRST to prevent double-firing
  await db.merchant.update({
    where: { id: merchantId },
    data: { referralRewardPaid: true },
  })

  // ── Pay the REFERRER ($10 RLUSD) ─────────────────────────────────────────
  if (referrer.xrplAddress) {
    try {
      await sendRLUSDReward(referrer.id, REFERRAL_REWARD_AMOUNT)
      
      await db.rewardEvent.create({
        data: {
          merchantId: referrer.id,
          type:        'REFERRAL_BONUS',
          amountRlusd: REFERRAL_REWARD_AMOUNT,
          description: `Referral reward — ${merchant.businessName || merchant.email} completed 5 transactions`,
        },
      })

      await db.merchant.update({
        where: { id: referrer.id },
        data: {
          rewardBalance:      { increment: REFERRAL_REWARD_AMOUNT },
          totalRewardsEarned: { increment: REFERRAL_REWARD_AMOUNT },
        },
      })

      console.log(`[referral] ✓ $${REFERRAL_REWARD_AMOUNT} RLUSD sent to referrer ${referrer.id}`)

      // Notify referrer via email
      await sendReferralRewardEmail(
        referrer.email,
        referrer.businessName || 'there',
        merchant.businessName || merchant.email,
        'referrer',
      )
    } catch (err) {
      console.error(`[referral] Failed to pay referrer ${referrer.id}:`, err)
    }
  } else {
    console.warn(`[referral] Referrer ${referrer.id} has no XRPL address — reward credited to balance only`)
    await db.merchant.update({
      where: { id: referrer.id },
      data: {
        rewardBalance:      { increment: REFERRAL_REWARD_AMOUNT },
        totalRewardsEarned: { increment: REFERRAL_REWARD_AMOUNT },
      },
    })
  }

  // ── Pay the REFERRED MERCHANT ($10 RLUSD) ────────────────────────────────
  if (merchant.xrplAddress) {
    try {
      await sendRLUSDReward(merchantId, REFERRAL_REWARD_AMOUNT)

      await db.rewardEvent.create({
        data: {
          merchantId,
          type:        'REFERRAL_BONUS',
          amountRlusd: REFERRAL_REWARD_AMOUNT,
          description: `Welcome bonus — you completed 5 transactions!`,
        },
      })

      await db.merchant.update({
        where: { id: merchantId },
        data: {
          rewardBalance:      { increment: REFERRAL_REWARD_AMOUNT },
          totalRewardsEarned: { increment: REFERRAL_REWARD_AMOUNT },
        },
      })

      console.log(`[referral] ✓ $${REFERRAL_REWARD_AMOUNT} RLUSD sent to referred merchant ${merchantId}`)

      // Notify referred merchant via email
      await sendReferralRewardEmail(
        merchant.email,
        merchant.businessName || 'there',
        referrer.businessName || referrer.email,
        'referred',
      )
    } catch (err) {
      console.error(`[referral] Failed to pay referred merchant ${merchantId}:`, err)
    }
  } else {
    console.warn(`[referral] Referred merchant ${merchantId} has no XRPL address — reward credited to balance only`)
    await db.merchant.update({
      where: { id: merchantId },
      data: {
        rewardBalance:      { increment: REFERRAL_REWARD_AMOUNT },
        totalRewardsEarned: { increment: REFERRAL_REWARD_AMOUNT },
      },
    })
  }

  console.log(`[referral] ✓ Referral rewards complete — both parties received $${REFERRAL_REWARD_AMOUNT} RLUSD`)
}

/**
 * Sends a celebratory email when referral rewards are disbursed.
 */
async function sendReferralRewardEmail(
  email:        string,
  name:         string,
  otherParty:   string,
  role:         'referrer' | 'referred',
): Promise<void> {
  const subject = role === 'referrer'
    ? `🎁 You earned $10 RLUSD — ${otherParty} just hit 5 transactions!`
    : `🎁 You earned $10 RLUSD — welcome to NETTEN!`

  const bodyText = role === 'referrer'
    ? `Great news! ${otherParty} — someone you referred — just completed their 5th transaction on NETTEN. As a thank you, we've sent $10 RLUSD directly to your wallet.`
    : `Congratulations on completing your first 5 transactions! As promised, we've sent $10 RLUSD directly to your wallet. Thanks to ${otherParty} for referring you.`

  try {
    await resend.emails.send({
      from:    'Netten <noreply@netten.app>',
      to:      email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a1a0f;color:#fff;border-radius:16px;">
          <div style="margin-bottom:24px;">
            <span style="background:#1d9e75;color:#fff;font-weight:700;padding:4px 12px;border-radius:8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Referral Reward</span>
          </div>
          <h1 style="color:#00ff88;font-size:28px;margin:0 0 8px;">You earned $10 RLUSD! 🎁</h1>
          <p style="color:#9ca3af;font-size:16px;margin:0 0 24px;">Hi ${name},</p>
          <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 24px;">
            ${bodyText}
          </p>
          <div style="background:#1a2e1f;border:1px solid #1d9e75;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Reward amount</p>
            <p style="color:#00ff88;font-size:32px;font-weight:700;margin:0;">$10 RLUSD</p>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Deposited to your wallet</p>
          </div>
          <a href="https://www.netten.app/dashboard/rewards" style="display:inline-block;background:#1d9e75;color:#fff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;">View Rewards Dashboard →</a>
          <p style="color:#4b5563;font-size:12px;margin:32px 0 0;">NETTEN · netten.app</p>
        </div>
      `,
    })
    console.log(`[referral] Reward email sent to ${email}`)
  } catch (err) {
    console.error('[referral] Reward email failed:', err)
  }
}

// ── Level-Up Notification ──────────────────────────────────────────────────

async function checkAndNotifyLevelUp(
  merchantId:   string,
  email:        string,
  businessName: string,
  createdAt:    Date,
  newTxnCount:  number,
  previousRate: number,
): Promise<void> {
  const newLevel = getMerchantLevel(createdAt, newTxnCount)

  if (newLevel.rate <= previousRate) return

  console.log(
    `[netTen] 🚀 Level up! merchantId=${merchantId} ` +
    `${previousRate} → ${newLevel.rate} RLUSD/milestone`,
  )

  await db.rewardEvent.create({
    data: {
      merchantId,
      type:        'LEVEL_UP',
      amountRlusd: 0,
      description: `Unlocked ${newLevel.label} — $${newLevel.rate} RLUSD per milestone`,
    },
  })

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
          <p style="color:#4b5563;font-size:12px;margin:32px 0 0;">NETTEN · netten.app</p>
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
 * Increments a merchant's Net Ten counter and fires rewards if due.
 * 
 * Triggers:
 *   - Referral reward at exactly 5 transactions ($10 RLUSD to both parties)
 *   - Net Ten reward every 10 transactions (rate based on level)
 *   - Level-up notification when thresholds are crossed
 *
 * @param merchantId - Netten internal merchant UUID.
 */
export async function incrementNetTen(merchantId: string): Promise<void> {
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

  // ── Referral reward check (fires at exactly 5 txns) ──────────────────────
  await checkAndFireReferralReward(merchantId, count)

  // ── Level-up check ───────────────────────────────────────────────────────
  await checkAndNotifyLevelUp(
    merchantId,
    merchant.email,
    merchant.businessName ?? '',
    merchant.createdAt,
    count,
    Number(previousRate),
  )

  // ── Net Ten milestone check — every 10th transaction ─────────────────────
  if (count % 10 !== 0) return

  console.log(
    `[netTen] 🎯 Milestone! merchantId=${merchantId} ` +
    `count=${count} level=${currentLevel.level} reward=$${rewardAmount} RLUSD`,
  )

  await sendRLUSDReward(merchantId, rewardAmount)

  await db.rewardEvent.create({
    data: {
      merchantId,
      type:        'TXN_MILESTONE',
      amountRlusd: rewardAmount,
      description: `Net Ten ${currentLevel.label} reward — transaction #${count}`,
    },
  })

  await db.merchant.update({
    where: { id: merchantId },
    data: {
      rewardBalance:      { increment: rewardAmount },
      totalRewardsEarned: { increment: rewardAmount },
    },
  })

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

// ── Exports ────────────────────────────────────────────────────────────────
export { REWARD_LEVELS, getMerchantLevel, monthsSince }
