// server/src/xrpl/handlers/subscription.ts

import { addMonths } from 'date-fns'
import { db } from '../../lib/db'
import { incrementNetTen } from './netTen'
import type { XRPLTransaction } from '../webhookRouter'

export async function handleSubscriptionPayment(tx: XRPLTransaction): Promise<void> {
  const { destinationTag, txHash } = tx

  console.log('[subscription] Payment received — tag:', destinationTag, 'hash:', txHash)

  const wallet = await db.wallet.findUnique({ where: { destinationTag } })

  if (!wallet) {
    console.error('[subscription] No wallet found for tag:', destinationTag)
    return
  }

  const { merchantId } = wallet

  const subscription = await db.subscription.findUnique({ where: { merchantId } })

  if (!subscription) {
    console.error('[subscription] No subscription found for merchantId:', merchantId)
    return
  }

  await db.subscription.update({
    where: { merchantId },
    data: {
      status:          'ACTIVE',
      lastPaymentDate: new Date(),
      nextDueDate:     addMonths(new Date(), 1),
      gracePeriodEnd:  null,
    },
  })

  console.log('[subscription] Renewed — merchantId:', merchantId)

  await incrementNetTen(merchantId)
  console.log('[subscription] Net Ten incremented — merchantId:', merchantId)
}
