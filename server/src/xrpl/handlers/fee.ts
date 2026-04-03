// server/src/xrpl/handlers/fee.ts

import type { XRPLTransaction } from '../webhookRouter'

export async function handleFeeCollection(tx: XRPLTransaction): Promise<void> {
  console.log(
    `[fee] Platform fee received — amount=${tx.amount} currency=${tx.currency} hash=${tx.txHash}`,
  )
}
