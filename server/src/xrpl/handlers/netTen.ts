// server/src/xrpl/handlers/netTen.ts

import { db } from '../../lib/db'
import { sendRLUSDReward } from '../xrplService'

const REWARD_BY_QUARTER: Record<number, number> = {
  1: 0.25,
  2: 0.50,
  3: 1.00,
  4: 2.00,
}

const QUARTER_MILESTONES: Record<number, number> = {
  1: 10,
  2: 20,
  3: 30,
}

export async function incrementNetTen(merchantId: string): Promise<void> {
  const counter = await db.netTenCounter.upsert({
    where:  { merchantId },
    create: {
      merchantId,
      totalCount:     1,
      currentQuarter: 1,
      rewardAmount:   REWARD_BY_QUARTER[1],
    },
    update: {
      totalCount: { increment: 1 },
    },
  })

  const newCount = counter.totalCount
  const quarter  = Math.min(counter.currentQuarter, 4)

  if (newCount % 10 === 0) {
    const rewardAmount = REWARD_BY_QUARTER[quarter]

    console.log(
      `[netTen] Milestone — merchantId=${merchantId} count=${newCount} Q=${quarter} reward=$${rewardAmount}`,
    )

    await sendRLUSDReward(merchantId, rewardAmount)

    await db.rewardEvent.create({
      data: {
        merchantId,
        type:        'TXN_MILESTONE',
        amountRlusd: rewardAmount,
        description: `Net Ten reward — Q${quarter} milestone at ${newCount} transactions`,
      },
    })

    await db.merchant.update({
      where: { id: merchantId },
      data: {
        rewardBalance:      { increment: rewardAmount },
        totalRewardsEarned: { increment: rewardAmount },
      },
    })

    const milestone = QUARTER_MILESTONES[quarter]

    if (quarter < 4 && milestone !== undefined && newCount >= milestone) {
      const nextQuarter = quarter + 1
      await db.netTenCounter.update({
        where: { merchantId },
        data: {
          currentQuarter: nextQuarter,
          rewardAmount:   REWARD_BY_QUARTER[nextQuarter] ?? REWARD_BY_QUARTER[4],
          lastRewardDate: new Date(),
        },
      })
      console.log(`[netTen] Quarter advanced — merchantId=${merchantId} Q${quarter}→Q${nextQuarter}`)
    } else {
      await db.netTenCounter.update({
        where: { merchantId },
        data: { lastRewardDate: new Date() },
      })
    }
  }
}
