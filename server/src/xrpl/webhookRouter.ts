/**
 * @file webhookRouter.ts
 * @description Routes validated XRPL transactions to the appropriate
 * domain handler based on destination tag ranges.
 *
 * Destination Tag Architecture:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Commerce Wallet  (Net Ten eligible)                             │
 * │   1,000,000 – 1,999,999  →  COMMERCE    (client → merchant)    │
 * │   2,000,000 – 2,999,999  →  SUBSCRIPTION (merchant → Netten)   │
 * │   3,000,000 – 3,999,999  →  ADDON       (merchant → Netten)    │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Fee Collection Wallet  (internal revenue, Net Ten excluded)     │
 * │   100,000 – 199,999    →  FEE          (1% platform cut)       │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Transactions without a destination tag are rejected to prevent
 * ambiguous routing and protect merchant accounting integrity.
 */

import { handleCommerceTransaction }  from './handlers/commerce'
import { handleSubscriptionPayment }  from './handlers/subscription'
import { handleAddOnPayment }         from './handlers/addon'
import { handleFeeCollection }        from './handlers/fee'

// ── Destination Tag Ranges ─────────────────────────────────────────────────

const TAG_RANGES = {
  COMMERCE: {
    MIN: 1_000_000,
    MAX: 1_999_999,
  },
  SUBSCRIPTION: {
    MIN: 2_000_000,
    MAX: 2_999_999,
  },
  ADDON: {
    MIN: 3_000_000,
    MAX: 3_999_999,
  },
} as const

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Normalised representation of an incoming XRPL payment transaction,
 * produced by the XRPL service after parsing the raw WebSocket event.
 */
export interface XRPLTransaction {
  /** XRPL r-address that received this payment. */
  walletAddress:  string
  /** On-ledger destination tag (undefined for untagged transactions). */
  destinationTag: number | undefined
  /** Amount string — drops for XRP, decimal string for IOUs. */
  amount:         string
  /** ISO 4217 currency code ('XRP' or 'USD' for RLUSD). */
  currency:       string
  /** 64-character hex transaction hash for idempotency and audit logging. */
  txHash:         string
  /** Sending account's XRPL r-address. */
  sender:         string
  /** Optional UTF-8 decoded memo from the on-chain transaction. */
  memo?:          string
}

// ── Router ─────────────────────────────────────────────────────────────────

/**
 * Routes an incoming XRPL payment to the correct domain handler.
 *
 * Routing logic (in priority order):
 *   1. Fee wallet address  → handleFeeCollection (no Net Ten)
 *   2. No destination tag  → reject (warn and return)
 *   3. COMMERCE range      → handleCommerceTransaction (Net Ten eligible)
 *   4. SUBSCRIPTION range  → handleSubscriptionPayment (Net Ten eligible)
 *   5. ADDON range         → handleAddOnPayment (Net Ten eligible)
 *   6. Unrecognised tag    → warn and return
 *
 * @param tx - Normalised XRPL transaction object.
 */
export async function routeIncomingTransaction(tx: XRPLTransaction): Promise<void> {
  const { walletAddress, destinationTag, txHash } = tx

  // ── Fee wallet — internal revenue collection, never touches Net Ten ──────
  if (walletAddress === process.env.FEE_WALLET_ADDRESS) {
    await handleFeeCollection(tx)
    return
  }

  // ── Reject untagged transactions ─────────────────────────────────────────
  if (destinationTag === undefined || destinationTag === null) {
    console.warn(`[webhookRouter] Rejected untagged transaction — hash=${txHash}`)
    return
  }

  // ── Commerce: client paying a merchant via pay link ──────────────────────
  if (
    destinationTag >= TAG_RANGES.COMMERCE.MIN &&
    destinationTag <= TAG_RANGES.COMMERCE.MAX
  ) {
    await handleCommerceTransaction(tx)
    return
  }

  // ── Subscription: merchant paying their monthly platform fee ─────────────
  if (
    destinationTag >= TAG_RANGES.SUBSCRIPTION.MIN &&
    destinationTag <= TAG_RANGES.SUBSCRIPTION.MAX
  ) {
    await handleSubscriptionPayment(tx)
    return
  }

  // ── Add-on: merchant paying for an optional feature add-on ───────────────
  if (
    destinationTag >= TAG_RANGES.ADDON.MIN &&
    destinationTag <= TAG_RANGES.ADDON.MAX
  ) {
    await handleAddOnPayment(tx)
    return
  }

  // ── Unrecognised tag — log for investigation ─────────────────────────────
  console.warn(
    `[webhookRouter] Unrecognised destination tag — ` +
    `tag=${destinationTag} hash=${txHash}`,
  )
}
