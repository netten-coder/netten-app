// server/src/routes/invoices.ts
import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { nanoid } from 'nanoid'
import { z } from 'zod'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() } catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

export async function invoiceRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  app.get('/', async (req: any) => {
    const { status } = req.query as any
    const where: any = { merchantId: req.user.merchantId }
    if (status) where.status = status
    const invoices = await db.invoice.findMany({ where, orderBy: { createdAt: 'desc' } })
    return { invoices }
  })

  app.post('/', async (req: any) => {
    const data = z.object({
      clientName:    z.string(),
      clientEmail:   z.string().email().optional(),
      amountUsd:     z.number().positive(),
      acceptedCoins: z.array(z.string()).default(['BTC','ETH','SOL','XRP','RLUSD']),
      dueDate:       z.string().optional(),
      description:   z.string().optional(),
      notes:         z.string().optional(),
    }).parse(req.body)

    const count = await db.invoice.count({ where: { merchantId: req.user.merchantId } })
    const invoice = await db.invoice.create({
      data: {
        ...data,
        merchantId:    req.user.merchantId,
        invoiceNumber: `INV-${String(count + 1).padStart(4, '0')}`,
        dueDate:       data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
    return invoice
  })

  app.delete('/:id', async (req: any) => {
    await db.invoice.update({ where: { id: req.params.id, merchantId: req.user.merchantId }, data: { status: 'CANCELLED' } })
    return { success: true }
  })
}
