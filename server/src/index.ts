// server/src/index.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'

import { authRoutes }        from './routes/auth'
import { merchantRoutes }    from './routes/merchant'
import { transactionRoutes } from './routes/transactions'
import { invoiceRoutes }     from './routes/invoices'
import { linkRoutes }        from './routes/payment-links'
import { rewardRoutes }      from './routes/rewards'
import { webhookRoutes }     from './routes/webhooks'
import { waitlistRoutes }     from './routes/waitlist'
import { xrplService }       from './services/xrpl'
import { subscriptionRoutes } from './routes/subscriptions'

const app = Fastify({ logger: process.env.NODE_ENV !== 'production' })

async function start() {
  await app.register(cors, {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://netten.app',
      'https://www.netten.app',
      'https://netten-web.vercel.app',
    ],
    credentials: true,
  })

  await app.register(cookie, {
    secret: process.env.MAGIC_LINK_SECRET!,
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'Netten API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }))

  // API routes
  await app.register(authRoutes,        { prefix: '/api/v1/auth' })
  await app.register(merchantRoutes,    { prefix: '/api/v1/merchant' })
  await app.register(transactionRoutes, { prefix: '/api/v1/transactions' })
  await app.register(invoiceRoutes,     { prefix: '/api/v1/invoices' })
  await app.register(linkRoutes,        { prefix: '/api/v1/payment-links' })
  await app.register(rewardRoutes,      { prefix: '/api/v1/rewards' })
  await app.register(waitlistRoutes, { prefix: '/api/v1' })
  await app.register(subscriptionRoutes, { prefix: '/api/v1/subscriptions' })
  await app.register(webhookRoutes,     { prefix: '/api/v1/webhooks' })

  const port = parseInt(process.env.PORT || '3001')
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`✓ Netten API running on port ${port}`)

  // Connect to XRPL
  try {
    await xrplService.connect()
    console.log('✓ Connected to XRP Ledger')
  } catch (err) {
    console.error('✗ XRPL connection failed:', err)
  }
}

start().catch(err => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
// redeploy Sat Mar 28 21:50:44 PDT 2026
// migrate to neon Sun Mar 29 01:17:16 PDT 2026
