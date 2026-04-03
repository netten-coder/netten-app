// server/src/xrpl/webhookRouter.ts

import { handleCommerceTransaction } from './handlers/commerce'
import { handleSubscriptionPayment } from './handlers/subscription'
import { handleAddOnPayment } from './handlers/addon'
import { handleFeeCollection } from './handlers/fee'

const COMMERCE_TAG_MIN     = 1_000_000
const COMMERCE_TAG_MAX     = 1_999_999
const SUBSCRIPTION_TAG_MIN = 2_000_000
const SUBSCRIPTION_TAG_MAX = 2_999_999
const ADDON_TAG_MIN        = 3_000_000
const ADDON_TAG_MAX        = 3_999_999

export interface XRPLTransaction {
  walletAddress:  string
  destinationTag: number | undefined
  amount:         string
  currency:       string
  txHash:         string
  sender:         string
  memo?:          string
}

export async function routeIncomingTransaction(tx: XRPLTransaction): Promise<void> {
  const { walletAddress, destinationTag } = tx

  if (walletAddress === process.env.FEE_WALLET_ADDRESS) {
    await handleFeeCollection(tx)
    return
  }

  if (destinationTag === undefined || destinationTag === null) {
    console.warn('[webhookRouter] Rejected untagged transaction:', tx.txHash)
    return
  }

  if (destinationTag >= COMMERCE_TAG_MIN && destinationTag <= COMMERCE_TAG_MAX) {
    await handleCommerceTransaction(tx)
    return
  }

  if (destinationTag >= SUBSCRIPTION_TAG_MIN && destinationTag <= SUBSCRIPTION_TAG_MAX) {
    await handleSubscriptionPayment(tx)
    return
  }

  if (destinationTag >= ADDON_TAG_MIN && destinationTag <= ADDON_TAG_MAX) {
    await handleAddOnPayment(tx)
    return
  }

  console.warn('[webhookRouter] Unrecognised destination tag:', destinationTag, tx.txHash)
}
