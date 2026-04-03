// server/src/routes/payment-links.ts
import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { nanoid } from 'nanoid'
import { z } from 'zod'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() } catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

export async function linkRoutes(app: FastifyInstance) {
  // FIX: resolve is PUBLIC — in its own scope, NO auth hook touches it
  // Previously the onRequest hook applied to ALL routes including this one
  app.get('/resolve/:slug', async (req: any, reply) => {
    const link = await (db as any).paymentLink.findUnique({
      where: { slug: req.params.slug },
      include: { merchant: { select: { businessName: true, xrplAddress: true } } },
    })
    if (!link || !link.isActive) return reply.status(404).send({ error: 'Link not found' })
    if (link.expiresAt && link.expiresAt < new Date()) return reply.status(410).send({ error: 'Link expired' })
    return link
  })

  // Protected routes in their own nested scope — auth hook only applies here
  app.register(async (p: FastifyInstance) => {
    p.addHook('onRequest', requireAuth)

    p.get('/', async (req: any) => {
      return (db as any).paymentLink.findMany({ where: { merchantId: req.user.merchantId }, orderBy: { createdAt: 'desc' } })
    })

    p.post('/', async (req: any) => {
      const data = z.object({
        description:   z.string(),
        amountUsd:     z.number().positive().optional(),
        acceptedCoins: z.array(z.string()).default(['BTC','ETH','SOL','XRP','RLUSD']),
        maxUses:       z.number().optional(),
        expiresAt:     z.string().optional(),
      }).parse(req.body)
      const slug = nanoid(10)
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${slug}`
      return (db as any).paymentLink.create({
        data: { ...data, merchantId: req.user.merchantId, slug, url, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined },
      })
    })

    p.delete('/:id', async (req: any) => {
      await (db as any).paymentLink.update({ where: { id: req.params.id, merchantId: req.user.merchantId }, data: { isActive: false } })
      return { success: true }
    })
  })
}
