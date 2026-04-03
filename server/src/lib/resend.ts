// server/src/lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)
EOF'cat > ~/Desktop/netten/server/src/routes/subscriptions.ts << 'EOF'
// server/src/routes/subscriptions.ts

import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'

async function requireAuth(req: any, reply: any) {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
}

export async function subscriptionRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  app.get('/me', async (req: any, reply) => {
    const { merchantId } = req.user

    const [subscription, addOns, netTen] = await Promise.all([
      db.subscription.findUnique({ where: { merchantId } }),
      db.addOn.findMany({
        where: {
          merchantId,
          OR: [{ activeTo: null }, { activeTo: { gt: new Date() } }],
        },
      }),
      db.netTenCounter.findUnique({ where: { merchantId } }),
    ])

    return reply.send({
      subscription,
      addOns,
      netTen: netTen ?? {
        totalCount:     0,
        currentQuarter: 1,
        rewardAmount:   0.25,
        lastRewardDate: null,
      },
    })
  })
}
