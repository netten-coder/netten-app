// server/src/routes/webhooks.ts
import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { nanoid } from 'nanoid'
import { z } from 'zod'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() } catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

export async function webhookRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  app.get('/', async (req: any) => db.webhook.findMany({ where: { merchantId: req.user.merchantId } }))

  app.post('/', async (req: any) => {
    const { url, events } = z.object({ url: z.string().url(), events: z.array(z.string()) }).parse(req.body)
    return db.webhook.create({ data: { merchantId: req.user.merchantId, url, events, secret: nanoid(32) } })
  })

  app.delete('/:id', async (req: any) => {
    await db.webhook.delete({ where: { id: req.params.id, merchantId: req.user.merchantId } })
    return { success: true }
  })
}
