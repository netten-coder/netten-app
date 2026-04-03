// server/src/xrpl/handlers/addon.ts

import { addMonths } from 'date-fns'
import { db } from '../../lib/db'
import { incrementNetTen } from './netTen'
import type { XRPLTransaction } from '../webhookRouter'

const ADDON_TYPE_BY_SUFFIX: Record<number, 'CSV_EXPORT' | 'INVOICING'> = {
  1: 'CSV_EXPORT',
  2: 'INVOICING',
}

export async function handleAddOnPayment(tx: XRPLTransaction): Promise<void> {
  const { destinationTag, txHash } = tx

  console.log('[addon] Payment received — tag:', destinationTag, 'hash:', txHash)

  const wallet = await db.wallet.findUnique({ where: { destinationTag } })

  if (!wallet) {
    console.error('[addon] No wallet found for tag:', destinationTag)
    return
  }

  const { merchantId } = wallet

  const suffix    = (destinationTag ?? 0) % 10
  const addonType = ADDON_TYPE_BY_SUFFIX[suffix]

  if (!addonType) {
    console.error('[addon] Unknown add-on suffix:', suffix)
    return
  }

  const existing = await db.addOn.findFirst({
    where: { merchantId, type: addonType, activeTo: { gt: new Date() } },
  })

  if (existing) {
    await db.addOn.update({
      where: { id: existing.id },
      data:  { activeTo: addMonths(existing.activeTo ?? new Date(), 1) },
    })
  } else {
    await db.addOn.create({
      data: {
        merchantId,
        type:     addonType,
        amount:   addonType === 'CSV_EXPORT' ? 22.00 : 11.00,
        activeTo: addMonths(new Date(), 1),
      },
    })
  }

  console.log('[addon] Activated/extended — merchantId:', merchantId, 'type:', addonType)

  await incrementNetTen(merchantId)
  console.log('[addon] Net Ten incremented — merchantId:', merchantId)
}
