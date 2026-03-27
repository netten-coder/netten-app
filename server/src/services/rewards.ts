// server/src/services/rewards.ts
// Netten Rewards Engine
//
// REWARD STRUCTURE — GRADUATED QUARTERLY (stealth mode):
//   Q1 (months 1–3):    $0.25 RLUSD per 10 transactions
//   Q2 (months 4–6):    $0.50 RLUSD per 10 transactions  (doubles)
//   Q3 (months 7–9):    $1.00 RLUSD per 10 transactions  (doubles)
//   Q4 (months 10–12+): $2.00 RLUSD per 10 transactions  (permanent cap)
//
// STEALTH: Not advertised. Merchants discover it organically.
// RLUSD is fully fractional on XRP Ledger (15 decimal places).

import { db } from '../lib/db'
import { xrplService } from './xrpl'

const QUARTERLY_REWARDS: Record<number, number> = {
  1: 0.25,
  2: 0.50,
  3: 1.00,
  4: 2.00,
}
const THRESHOLD = 10

const VOLUME_BONUS_RATES: Record<string, number> = {
  STARTER:    0,
  PRO:        0.0005,
  BUSINESS:   0.0010,
  ENTERPRISE: 0.0015,
}

function getMerchantQuarter(createdAt: Date): number {
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000
  const months = Math.floor((Date.now() - createdAt.getTime()) / msPerMonth)
  if (months < 3)  return 1
  if (months < 6)  return 2
  if (months < 9)  return 3
  return 4
}

function getRewardAmount(createdAt: Date): number {
  return QUARTERLY_REWARDS[getMerchantQuarter(createdAt)]
}

function getNextDoublingDate(createdAt: Date, quarter: number): string | null {
  if (quarter >= 4) return null
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000
  return new Date(createdAt.getTime() + quarter * 3 * msPerMonth).toISOString()
}

class RewardsService {
  async processTransactionReward(params: { merchantId: string; transactionId: string }) {
    const merchant = await db.merchant.findUnique({
      where: { id: params.merchantId },
      select: { id: true, xrplAddress: true, rewardBalance: true, txnCountSinceReward: true, plan: true, createdAt: true },
    })
    if (!merchant) throw new Error('Merchant not found')

    const quarter      = getMerchantQuarter(merchant.createdAt)
    const rewardAmount = getRewardAmount(merchant.createdAt)
    const newCount     = merchant.txnCountSinceReward + 1

    if (newCount >= THRESHOLD) {
      const newBalance = merchant.rewardBalance + rewardAmount
      await db.$transaction([
        db.merchant.update({
          where: { id: params.merchantId },
          data: { rewardBalance: newBalance, txnCountSinceReward: 0, totalRewardsEarned: { increment: rewardAmount } },
        }),
        db.rewardEvent.create({
          data: {
            merchantId: params.merchantId,
            type: 'TXN_MILESTONE',
            amountRlusd: rewardAmount,
            transactionId: params.transactionId,
            description: `${rewardAmount.toFixed(2)} RLUSD — ${THRESHOLD} transactions completed`,
          },
        }),
      ])
      if (merchant.xrplAddress) {
        this.sendRewardAsync({ merchantId: params.merchantId, merchantAddress: merchant.xrplAddress, amountRlusd: rewardAmount, memo: `Netten Q${quarter} reward` }).catch(console.error)
      }
      return { rewardPaid: true, rewardAmount, newBalance, txnsToNextReward: THRESHOLD, currentQuarter: quarter }
    } else {
      await db.merchant.update({ where: { id: params.merchantId }, data: { txnCountSinceReward: newCount } })
      return { rewardPaid: false, rewardAmount, newBalance: merchant.rewardBalance, txnsToNextReward: THRESHOLD - newCount, currentQuarter: quarter }
    }
  }

  async getRewardSummary(merchantId: string) {
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { plan: true, rewardBalance: true, totalRewardsEarned: true, txnCountSinceReward: true, createdAt: true },
    })
    if (!merchant) throw new Error('Merchant not found')

    const recentEvents = await db.rewardEvent.findMany({ where: { merchantId }, orderBy: { createdAt: 'desc' }, take: 10 })
    const quarter      = getMerchantQuarter(merchant.createdAt)
    const rewardAmount = getRewardAmount(merchant.createdAt)

    return {
      balance:           merchant.rewardBalance,
      totalEarned:       merchant.totalRewardsEarned,
      txnProgress:       merchant.txnCountSinceReward,
      txnsToNextReward:  THRESHOLD - merchant.txnCountSinceReward,
      progressPercent:   Math.round((merchant.txnCountSinceReward / THRESHOLD) * 100),
      nextRewardAmount:  rewardAmount,
      threshold:         THRESHOLD,
      currentQuarter:    quarter,
      nextQuarterAmount: quarter < 4 ? QUARTERLY_REWARDS[quarter + 1] : null,
      nextDoubling:      getNextDoublingDate(merchant.createdAt, quarter),
      atMaxRate:         quarter >= 4,
      volumeBonusRate:   VOLUME_BONUS_RATES[merchant.plan] || 0,
      recentEvents,
    }
  }

  async processMonthlyVolumeBonuses() {
    const lastMonth  = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    const monthEnd   = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59)
    const monthLabel = monthStart.toISOString().slice(0, 7)

    const merchants = await db.merchant.findMany({
      where: { plan: { in: ['PRO', 'BUSINESS', 'ENTERPRISE'] }, isActive: true },
      select: { id: true, plan: true, xrplAddress: true },
    })

    for (const merchant of merchants) {
      const rate = VOLUME_BONUS_RATES[merchant.plan]
      if (!rate) continue
      const vol = await db.transaction.aggregate({
        where: { merchantId: merchant.id, status: 'COMPLETED', createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { netAmount: true },
      })
      const monthlyVolume = vol._sum.netAmount || 0
      if (monthlyVolume === 0) continue
      const bonus = parseFloat((monthlyVolume * rate).toFixed(6))
      if (bonus < 0.01) continue

      await db.$transaction([
        db.merchant.update({ where: { id: merchant.id }, data: { rewardBalance: { increment: bonus }, totalRewardsEarned: { increment: bonus } } }),
        db.rewardEvent.create({ data: { merchantId: merchant.id, type: 'VOLUME_BONUS', amountRlusd: bonus, description: `${(rate * 100).toFixed(2)}% volume bonus — ${monthLabel}` } }),
      ])
      if (merchant.xrplAddress) {
        await this.sendRewardAsync({ merchantId: merchant.id, merchantAddress: merchant.xrplAddress, amountRlusd: bonus, memo: `Netten volume bonus ${monthLabel}` }).catch(console.error)
      }
    }
  }

  private async sendRewardAsync(params: { merchantId: string; merchantAddress: string; amountRlusd: number; memo: string }) {
    await xrplService.sendRLUSD({ destination: params.merchantAddress, amount: params.amountRlusd, memo: params.memo })
  }

  async withdrawRewards(merchantId: string, toAddress: string, amount: number) {
    const merchant = await db.merchant.findUnique({ where: { id: merchantId }, select: { rewardBalance: true } })
    if (!merchant) throw new Error('Merchant not found')
    if (merchant.rewardBalance < amount) throw new Error('Insufficient reward balance')

    await db.$transaction([
      db.merchant.update({ where: { id: merchantId }, data: { rewardBalance: { decrement: amount } } }),
      db.rewardEvent.create({ data: { merchantId, type: 'WITHDRAWAL', amountRlusd: -amount, description: `Withdrawal of ${amount.toFixed(4)} RLUSD to ${toAddress.slice(0, 8)}...` } }),
    ])
    await xrplService.sendRLUSD({ destination: toAddress, amount, memo: 'Netten rewards withdrawal' })
    return { success: true, withdrawn: amount }
  }
}

export const rewardsService = new RewardsService()
