// server/src/xrpl/handlers/commerce.ts

import { db } from '../../lib/db'
import { incrementNetTen } from './netTen'
import type { XRPLTransaction } from '../webhookRouter'

export async function handleCommerceTransaction(tx: XRPLTransaction): Promise<void> {
  const { destinationTag, txHash } = tx

  console.log('[commerce] Incoming payment — tag:', destinationTag, 'hash:', txHash)

  const wallet = await db.wallet.findUnique({ where: { destinationTag } })

  if (!wallet) {
    console.error('[commerce] No wallet found for tag:', destinationTag)
    return
  }

  const { merchantId } = wallet

  const transaction = await db.transaction.findFirst({
    where:   { merchantId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (transaction) {
    await db.transaction.update({
      where: { id: transaction.id },
      data:  { status: 'COMPLETED', xrplTxHash: txHash, updatedAt: new Date() },
    })
    console.log('[commerce] Transaction completed — id:', transaction.id)
  }

  await incrementNetTen(merchantId)
  console.log('[commerce] Net Ten incremented — merchantId:', merchantId)
}
