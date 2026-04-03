// server/src/routes/offramp.ts
// Generates a signed Alchemy Pay off-ramp URL for RLUSD → fiat bank withdrawal.
// Alchemy Pay handles KYC, conversion, and bank transfer — we just generate the URL.

import { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { z } from 'zod'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() } catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

function buildAlchemyPayOffRampUrl(params: {
  appId:     string
  secretKey: string
  amount:    number
  address:   string
  crypto:    string
  network:   string
  fiat:      string
}): string {
  const { appId, secretKey, amount, address, crypto: cryptoCurrency, network, fiat } = params

  // Build the query string Alchemy Pay expects
  const timestamp = Date.now().toString()
  const queryParams: Record<string, string> = {
    appId,
    crypto:      cryptoCurrency,
    network,
    cryptoAmount: amount.toFixed(4),
    fiat,
    address,
    type:        'offramp',
    timestamp,
  }

  // Sort keys and build signature string
  const sortedKeys = Object.keys(queryParams).sort()
  const signStr    = sortedKeys.map(k => `${k}=${queryParams[k]}`).join('&')

  // HMAC-SHA256 signature
  const sign = crypto
    .createHmac('sha256', secretKey)
    .update(signStr)
    .digest('hex')

  const urlParams = new URLSearchParams({ ...queryParams, sign })
  return `https://ramp.alchemypay.org/#/index?${urlParams.toString()}`
}

export async function offrampRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  app.post('/rewards/offramp-url', async (req: any, reply) => {
    const { amount } = z.object({
      amount: z.number().positive(),
    }).parse(req.body)

    const appId     = process.env.ALCHEMY_PAY_APP_ID
    const secretKey = process.env.ALCHEMY_PAY_SECRET_KEY

    if (!appId || !secretKey) {
      return reply.status(503).send({ error: 'Off-ramp not configured' })
    }

    // Get merchant XRPL address to use as the source wallet
    const { db } = await import('../lib/db')
    const merchant = await db.merchant.findUnique({
      where:  { id: req.user.merchantId },
      select: { xrplAddress: true },
    })

    const address = merchant?.xrplAddress || ''

    const url = buildAlchemyPayOffRampUrl({
      appId,
      secretKey,
      amount,
      address,
      crypto:  'RLUSD',
      network: 'XRP',
      fiat:    'USD',
    })

    return reply.send({ url })
  })
}
