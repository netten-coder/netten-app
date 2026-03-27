// server/src/routes/rewards.ts
import { FastifyInstance } from 'fastify'
import { rewardsService } from '../services/rewards'
import { db } from '../lib/db'
import { z } from 'zod'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() } catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

export async function rewardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  app.get('/summary', async (req: any) => rewardsService.getRewardSummary(req.user.merchantId))

  app.get('/history', async (req: any) => {
    const { page = 1 } = req.query as any
    const take = 20, skip = (parseInt(page) - 1) * take
    const events = await db.rewardEvent.findMany({
      where: { merchantId: req.user.merchantId },
      orderBy: { createdAt: 'desc' },
      take, skip,
    })
    return { events }
  })

  app.post('/withdraw', async (req: any) => {
    const { toAddress, amount } = z.object({
      toAddress: z.string().min(25),
      amount:    z.number().positive(),
    }).parse(req.body)
    return rewardsService.withdrawRewards(req.user.merchantId, toAddress, amount)
  })
}
