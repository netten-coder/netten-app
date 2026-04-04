/**
 * @file offramp.ts
 * @description Generates a signed MoonPay off-ramp URL for RLUSD to fiat withdrawal.
 * MoonPay handles all KYC, conversion, compliance and bank transfer.
 * Netten never touches merchant banking details.
 *
 * Flow:
 *   1. Merchant clicks "Withdraw to Bank" in dashboard
 *   2. Frontend calls POST /api/v1/rewards/offramp-url with RLUSD amount
 *   3. Backend generates signed MoonPay sell widget URL
 *   4. Frontend opens MoonPay widget — merchant adds bank, completes KYC once
 *   5. MoonPay converts RLUSD to fiat and sends to merchant bank account
 *
 * Fees: 1% for bank transfers, 4.5% for cards — shown transparently in widget.
 */

import { FastifyInstance } from 'fastify'
import crypto              from 'crypto'
import { z }               from 'zod'
import { db }              from '../lib/db'

// ── Auth guard ─────────────────────────────────────────────────────────────

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() }
  catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

// ── MoonPay URL builder ────────────────────────────────────────────────────

/**
 * Builds a signed MoonPay sell widget URL.
 * MoonPay requires HMAC-SHA256 signature over the query string
 * to prevent URL tampering.
 *
 * @param params - Off-ramp parameters
 * @returns      - Fully signed MoonPay sell widget URL
 */
function buildMoonPayOffRampUrl(params: {
  apiKey:        string
  secretKey:     string
  amount:        number
  walletAddress: string
  currencyCode:  string
  baseCurrency:  string
}): string {
  const { apiKey, secretKey, amount, walletAddress, currencyCode, baseCurrency } = params

  const query = new URLSearchParams({
    apiKey,
    baseCurrencyCode:    currencyCode,
    baseCurrencyAmount:  amount.toFixed(2),
    defaultCurrencyCode: baseCurrency,
    walletAddress,
  })

  const queryString = query.toString()

  // HMAC-SHA256 signature over the full query string
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update('?' + queryString)
    .digest('base64')

  query.append('signature', signature)

  return 'https://sell.moonpay.com?' + query.toString()
}

// ── Route registration ─────────────────────────────────────────────────────

export async function offrampRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  /**
   * POST /api/v1/rewards/offramp-url
   * Generates a signed MoonPay sell widget URL for merchant bank withdrawal.
   */
  app.post('/rewards/offramp-url', async (req: any, reply) => {
    const { amount } = z.object({
      amount: z.number().positive(),
    }).parse(req.body)

    const apiKey    = process.env.MOONPAY_API_KEY
    const secretKey = process.env.MOONPAY_SECRET_KEY

    if (!apiKey || !secretKey) {
      return reply.status(503).send({ error: 'Off-ramp not configured' })
    }

    const merchant = await db.merchant.findUnique({
      where:  { id: req.user.merchantId },
      select: { xrplAddress: true },
    })

    if (!merchant?.xrplAddress) {
      return reply.status(400).send({ error: 'No XRPL wallet configured' })
    }

    const url = buildMoonPayOffRampUrl({
      apiKey,
      secretKey,
      amount,
      walletAddress: merchant.xrplAddress,
      currencyCode:  'rlusd_xrp',
      baseCurrency:  'usd',
    })

    return reply.send({ url, provider: 'moonpay' })
  })
}
