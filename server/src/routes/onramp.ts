/**
 * @file onramp.ts
 * @description MoonPay on-ramp for customer card payments on Netten pay pages.
 * Generates a signed MoonPay buy widget URL pre-filled with RLUSD and the
 * merchant XRPL wallet address. Customer never leaves Netten's flow — MoonPay
 * opens in a popup, handles card processing + KYC, and sends RLUSD directly
 * to the merchant wallet. Netten never sees card data.
 *
 * Flow:
 *   1. Customer opens pay link, clicks "Pay with card"
 *   2. Frontend calls GET /api/v1/payment-links/moonpay-onramp/:slug?amount=X
 *   3. Backend resolves pay link → gets merchant XRPL wallet
 *   4. Backend generates signed MoonPay buy URL with amount + wallet pre-filled
 *   5. Frontend opens MoonPay widget in popup — customer pays by card
 *   6. MoonPay converts fiat → RLUSD → sends to merchant XRPL wallet
 *   7. XRPL subscription detects payment → Net Ten fires as normal
 *
 * No auth required — this is a public route for customers.
 * Affiliate revenue accrues to Netten's MoonPay account per transaction.
 */

import { FastifyInstance } from 'fastify'
import crypto              from 'crypto'
import { db }              from '../lib/db'

// ── MoonPay buy URL builder ────────────────────────────────────────────────

function buildMoonPayOnRampUrl(params: {
  apiKey:        string
  secretKey:     string
  amount:        number
  walletAddress: string
}): string {
  const { apiKey, secretKey, amount, walletAddress } = params

  const query = new URLSearchParams({
    apiKey,
    currencyCode:        'rlusd_xrp',   // RLUSD on XRP Ledger
    baseCurrencyCode:    'usd',
    baseCurrencyAmount:  amount.toFixed(2),
    walletAddress,
    showAllCurrencies:   'false',        // lock to RLUSD only
    lockAmount:          'true',         // pre-fill, don't let customer change
  })

  const queryString = query.toString()

  // HMAC-SHA256 — same pattern as off-ramp
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update('?' + queryString)
    .digest('base64')

  query.append('signature', signature)

  return 'https://buy.moonpay.com?' + query.toString()
}

// ── Route registration ─────────────────────────────────────────────────────

export async function onrampRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/payment-links/moonpay-onramp/:slug?amount=X
   * Public — no auth. Resolves pay link and returns a signed MoonPay buy URL.
   */
  app.get('/moonpay-onramp/:slug', async (req: any, reply) => {
    const { slug }   = req.params
    const { amount } = req.query as { amount?: string }

    const parsedAmount = parseFloat(amount || '0')
    if (!parsedAmount || parsedAmount <= 0) {
      return reply.status(400).send({ error: 'Invalid amount' })
    }

    const apiKey    = process.env.MOONPAY_API_KEY
    const secretKey = process.env.MOONPAY_SECRET_KEY

    if (!apiKey || !secretKey) {
      return reply.status(503).send({ error: 'Card payments not configured' })
    }

    // Resolve pay link → merchant wallet
    const link = await db.paymentLink.findFirst({
      where:  { slug, isActive: true },
      include: { merchant: { select: { xrplAddress: true } } },
    })

    if (!link) {
      return reply.status(404).send({ error: 'Pay link not found' })
    }

    if (!link.merchant?.xrplAddress) {
      return reply.status(400).send({ error: 'Merchant has no XRPL wallet configured' })
    }

    const url = buildMoonPayOnRampUrl({
      apiKey,
      secretKey,
      amount:        parsedAmount,
      walletAddress: link.merchant.xrplAddress,
    })

    return reply.send({ url, provider: 'moonpay' })
  })
}
