// server/src/routes/merchant.ts
import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { xrplService } from '../services/xrpl'
import { Wallet } from 'xrpl'
import { z } from 'zod'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() } catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

export async function merchantRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  app.get('/me', async (req: any) => {
    return db.merchant.findUnique({ where: { id: req.user.merchantId } })
  })

  app.put('/me', async (req: any) => {
    const data = z.object({
      businessName: z.string().optional(),
      country:      z.string().optional(),
      timezone:     z.string().optional(),
    }).parse(req.body)
    return db.merchant.update({ where: { id: req.user.merchantId }, data })
  })

  app.get('/dashboard', async (req: any) => {
    const id = req.user.merchantId
    const [merchant, recentTransactions, pendingInvoices, rewards] = await Promise.all([
      db.merchant.findUnique({ where: { id } }),
      db.transaction.findMany({ where: { merchantId: id }, orderBy: { createdAt: 'desc' }, take: 6 }),
      db.invoice.findMany({ where: { merchantId: id, status: { in: ['UNPAID', 'OVERDUE'] } } }),
      db.rewardEvent.aggregate({ where: { merchantId: id, type: { not: 'WITHDRAWAL' } }, _sum: { amountRlusd: true } }),
    ])
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayTxns = await db.transaction.aggregate({
      where: { merchantId: id, status: 'COMPLETED', createdAt: { gte: todayStart } },
      _sum: { netAmount: true }, _count: true,
    })
    const activeLinks = await db.paymentLink.count({ where: { merchantId: id, isActive: true } })
    return { merchant, recentTransactions, pendingInvoices, activePaymentLinks: activeLinks, today: { revenue: todayTxns._sum.netAmount || 0, txns: todayTxns._count }, rewards: { totalEarned: rewards._sum.amountRlusd || 0 } }
  })

  app.get('/analytics', async (req: any) => {
    const { period = '7d' } = req.query as any
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const id   = req.user.merchantId

    const [totalAgg, txnCount, topCoins] = await Promise.all([
      db.transaction.aggregate({ where: { merchantId: id, status: 'COMPLETED', createdAt: { gte: from } }, _sum: { netAmount: true } }),
      db.transaction.count({ where: { merchantId: id, status: 'COMPLETED', createdAt: { gte: from } } }),
      db.transaction.groupBy({ by: ['fromCoin'], where: { merchantId: id, status: 'COMPLETED', createdAt: { gte: from } }, _sum: { netAmount: true }, orderBy: { _sum: { netAmount: 'desc' } }, take: 5 }),
    ])

    return { totalVolume: totalAgg._sum.netAmount || 0, txnCount, avgTxnSize: txnCount > 0 ? (totalAgg._sum.netAmount || 0) / txnCount : 0, topCoins }
  })

  app.post('/wallet', async (req: any) => {
    const { xrplAddress } = z.object({ xrplAddress: z.string().min(25) }).parse(req.body)
    return db.merchant.update({ where: { id: req.user.merchantId }, data: { xrplAddress } })
  })

  app.get('/wallet/new', async () => {
    const wallet = Wallet.generate()
    return { address: wallet.address, seed: wallet.seed }
  })
}
