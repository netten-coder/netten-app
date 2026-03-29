import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../lib/db'

export async function waitlistRoutes(app: FastifyInstance) {
  app.post('/waitlist', async (req, reply) => {
    const { email, referralCode } = z.object({
      email: z.string().email(),
      referralCode: z.string().optional(),
    }).parse(req.body)

    const existing = await (db as any).waitlistEntry.findUnique({ where: { email } })
    if (existing) {
      const count = await (db as any).waitlistEntry.count()
      return reply.send({ success: true, referralCode: existing.referralCode, count, alreadyJoined: true })
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'NET'
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]

    await (db as any).waitlistEntry.create({
      data: { email, referralCode: code, referredBy: referralCode || null }
    })

    const count = await (db as any).waitlistEntry.count()
    return reply.send({ success: true, referralCode: code, count })
  })

  app.get('/waitlist/count', async (_req, reply) => {
    const count = await (db as any).waitlistEntry.count()
    return reply.send({ count })
  })
}
// palindrome build Sun Mar 29 14:00:31 PDT 2026
