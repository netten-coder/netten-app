// server/src/routes/transactions.ts
import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { rewardsService } from '../services/rewards'
import { nanoid } from 'nanoid'
import { z } from 'zod'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() } catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  app.get('/', async (req: any) => {
    const { status, fromCoin, page = 1 } = req.query as any
    const take = 20, skip = (parseInt(page) - 1) * take
    const where: any = { merchantId: req.user.merchantId }
    if (status) where.status = status
    if (fromCoin) where.fromCoin = fromCoin
    const [transactions, total] = await Promise.all([
      db.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
      db.transaction.count({ where }),
    ])
    return { transactions, pagination: { total, page: parseInt(page), pages: Math.ceil(total / take) } }
  })

  app.get('/:id', async (req: any) => {
    return db.transaction.findFirst({ where: { id: req.params.id, merchantId: req.user.merchantId } })
  })

  app.post('/initiate', async (req: any) => {
    const data = z.object({
      fromCoin:      z.string(),
      amountUsd:     z.number().positive(),
      description:   z.string().optional(),
      source:        z.string().optional(),
      paymentLinkId: z.string().optional(),
    }).parse(req.body)

    const merchant = await db.merchant.findUnique({ where: { id: req.user.merchantId }, select: { xrplAddress: true, plan: true } })
    const feeRate  = { STARTER: 0.01, PRO: 0.0075, BUSINESS: 0.005, ENTERPRISE: 0.0025 }[merchant?.plan || 'STARTER'] || 0.01
    const platformFee = data.amountUsd * feeRate
    const netAmount   = data.amountUsd - platformFee - 0.001

    const txn = await db.transaction.create({
      data: {
        merchantId:        req.user.merchantId,
        fromCoin:          data.fromCoin,
        toAmount:          data.amountUsd,
        netAmount:         parseFloat(netAmount.toFixed(4)),
        platformFeeAmount: parseFloat(platformFee.toFixed(4)),
        status:            'PENDING',
        description:       data.description,
        source:            data.source || 'DIRECT',
        paymentLinkId:     data.paymentLinkId,
        payAddress:        merchant?.xrplAddress || '',
        payAmount:         data.amountUsd,
      },
    })

    return {
      transactionId: txn.id,
      payAddress:    txn.payAddress,
      payAmount:     txn.payAmount,
      fromCoin:      data.fromCoin,
      feeBreakdown: {
        grossAmount:   `$${data.amountUsd.toFixed(2)}`,
        platformFee:   `-$${platformFee.toFixed(4)}`,
        alchemyFee:    '-$0.0010',
        xrplGas:       '-$0.0001',
        netToMerchant: `$${netAmount.toFixed(4)} RLUSD`,
      },
    }
  })
}
