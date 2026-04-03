// server/src/xrpl/xrplService.ts

import { db } from '../lib/db'
import { xrplService } from '../services/xrpl'

export async function sendRLUSDReward(merchantId: string, amount: number): Promise<void> {
  const merchant = await db.merchant.findUnique({
    where:  { id: merchantId },
    select: { xrplAddress: true },
  })

  if (!merchant?.xrplAddress) {
    console.warn(`[xrplService] No XRPL address for merchantId=${merchantId} — skipping reward`)
    return
  }

  try {
    await xrplService.sendRLUSD({
      destination: merchant.xrplAddress,
      amount,
      memo: `Netten Net Ten reward — $${amount} RLUSD`,
    })
    console.log(`[xrplService] Reward sent — merchantId=${merchantId} amount=${amount}`)
  } catch (err) {
    console.error(`[xrplService] Reward failed — merchantId=${merchantId}`, err)
  }
}
