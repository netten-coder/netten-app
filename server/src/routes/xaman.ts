/**
 * @file xaman.ts
 * @description Xaman (XUMM) wallet integration for Netten.
 *
 * Two flows:
 *
 * 1. MERCHANT LOGIN via Xaman
 *    POST /api/v1/xaman/signin         Creates SignIn payload, returns QR + deeplink
 *    GET  /api/v1/xaman/payload/:uuid  Polls until signed, returns XRPL address
 *    Merchant scans QR in Xaman, approves, XRPL address auto-saves to Settings.
 *    No seed phrase, no manual copy-paste. Non-custodial throughout.
 *
 * 2. CUSTOMER PAYMENT via Xaman
 *    POST /api/v1/xaman/payment-request  Creates Payment payload pre-filled with
 *    destination, amount, and destination tag. Customer opens deeplink in Xaman,
 *    reviews and taps Confirm. One tap fires the XRPL payment.
 *
 * Xaman Ecosystem Fund:
 *    10% of Xaman service fees from Netten-originated transactions are
 *    distributed back to Netten as builder revenue share automatically.
 */

import { FastifyInstance } from 'fastify'
import { z }               from 'zod'
import { db }              from '../lib/db'

// ── Constants ──────────────────────────────────────────────────────────────

const XAMAN_API_BASE = 'https://xumm.app/api/v1/platform'
const DROPS_PER_XRP  = 1_000_000

// ── Auth guard ─────────────────────────────────────────────────────────────

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() }
  catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns headers required for all Xaman API requests.
 */
function xamanHeaders(): Record<string, string> {
  return {
    'Content-Type':  'application/json',
    'X-API-Key':     process.env.XAMAN_API_KEY    ?? '',
    'X-API-Secret':  process.env.XAMAN_API_SECRET ?? '',
  }
}

/**
 * Creates a Xaman payload via the XUMM API.
 * Returns the payload UUID, QR PNG URL, and mobile deeplink.
 */
async function createXamanPayload(body: object): Promise<{
  uuid:      string
  qrPng:     string
  deeplink:  string
  websocket: string
}> {
  const res = await fetch(`${XAMAN_API_BASE}/payload`, {
    method:  'POST',
    headers: xamanHeaders(),
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Xaman API error: ${res.status} ${JSON.stringify(err)}`)
  }

  const data = await res.json() as any

  return {
    uuid:      data.uuid,
    qrPng:     data.refs?.qr_png           ?? '',
    deeplink:  data.next?.always           ?? '',
    websocket: data.refs?.websocket_status ?? '',
  }
}

/**
 * Fetches the current status of a Xaman payload.
 * Returns signed status and the signing account if approved.
 */
async function getXamanPayload(uuid: string): Promise<{
  signed:  boolean
  account: string | null
  expired: boolean
}> {
  const res = await fetch(`${XAMAN_API_BASE}/payload/${uuid}`, {
    headers: xamanHeaders(),
  })

  if (!res.ok) throw new Error(`Xaman payload fetch failed: ${res.status}`)

  const data = await res.json() as any

  return {
    signed:  data.meta?.signed      ?? false,
    expired: data.meta?.expired     ?? false,
    account: data.response?.account ?? null,
  }
}

// ── Route registration ─────────────────────────────────────────────────────

export async function xamanRoutes(app: FastifyInstance) {

  /**
   * POST /api/v1/xaman/signin
   * Creates a Xaman SignIn payload for merchant authentication.
   * No auth required — this IS the authentication mechanism.
   *
   * Returns: { uuid, qrPng, deeplink, websocket }
   * Frontend shows QR, polls GET /api/v1/xaman/payload/:uuid until signed,
   * then auto-saves the returned XRPL address to merchant settings.
   */
  app.post('/signin', async (_req, reply) => {
    if (!process.env.XAMAN_API_KEY || !process.env.XAMAN_API_SECRET) {
      return reply.status(503).send({ error: 'Xaman not configured' })
    }

    try {
      const payload = await createXamanPayload({
        txjson: { TransactionType: 'SignIn' },
        options: {
          expire:     10,
          return_url: {
            app: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?xaman=signed`,
            web: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?xaman=signed`,
          },
        },
        custom_meta: {
          instruction: 'Sign in to Netten — your XRPL payment platform',
          blob: { source: 'netten_signin' },
        },
      })

      console.log(`[xaman] SignIn payload created — uuid=${payload.uuid}`)
      return reply.send(payload)

    } catch (err: any) {
      console.error('[xaman] SignIn creation failed:', err.message)
      return reply.status(500).send({ error: 'Failed to create Xaman sign-in' })
    }
  })


  /**
   * GET /api/v1/xaman/payload/:uuid
   * Polls the status of a Xaman payload.
   * Called repeatedly by frontend after showing QR code.
   *
   * Returns: { signed, account, expired }
   * When signed=true, account contains the merchant XRPL address.
   */
  app.get('/payload/:uuid', async (req: any, reply) => {
    const { uuid } = req.params as { uuid: string }

    try {
      const status = await getXamanPayload(uuid)
      return reply.send(status)
    } catch (err: any) {
      console.error(`[xaman] Payload fetch failed uuid=${uuid}:`, err.message)
      return reply.status(500).send({ error: 'Failed to fetch Xaman payload' })
    }
  })


  /**
   * POST /api/v1/xaman/payment-request
   * Creates a pre-filled Xaman Payment payload for a customer pay link.
   *
   * The customer opens the deeplink in Xaman and sees destination, amount,
   * and destination tag pre-filled. One tap to confirm and the payment fires.
   *
   * This eliminates all copy-paste errors and destination tag confusion
   * for XRPL-native customers paying via Xaman.
   */
  app.post('/payment-request', { onRequest: [requireAuth] }, async (req: any, reply) => {
    const { destination, amountXrp, destinationTag, memo } = z.object({
      destination:    z.string().min(25),
      amountXrp:      z.number().positive(),
      destinationTag: z.number().int().optional(),
      memo:           z.string().optional(),
    }).parse(req.body)

    if (!process.env.XAMAN_API_KEY || !process.env.XAMAN_API_SECRET) {
      return reply.status(503).send({ error: 'Xaman not configured' })
    }

    try {
      const amountDrops = Math.round(amountXrp * DROPS_PER_XRP).toString()

      const txjson: Record<string, any> = {
        TransactionType: 'Payment',
        Destination:     destination,
        Amount:          amountDrops,
      }

      if (destinationTag !== undefined) {
        txjson.DestinationTag = destinationTag
      }

      const payload = await createXamanPayload({
        txjson,
        options: {
          submit:     true,
          expire:     15,
          return_url: {
            app: `${process.env.NEXT_PUBLIC_APP_URL}/pay/confirmed`,
            web: `${process.env.NEXT_PUBLIC_APP_URL}/pay/confirmed`,
          },
        },
        custom_meta: {
          instruction: memo ?? 'Netten payment — confirm to send',
          blob: { source: 'netten_payment' },
        },
      })

      console.log(
        `[xaman] Payment payload created — ` +
        `uuid=${payload.uuid} destination=${destination} amount=${amountXrp}XRP`,
      )

      return reply.send(payload)

    } catch (err: any) {
      console.error('[xaman] Payment payload creation failed:', err.message)
      return reply.status(500).send({ error: 'Failed to create Xaman payment' })
    }
  })
}
