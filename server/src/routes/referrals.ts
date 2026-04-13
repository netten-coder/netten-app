/**
 * @file referrals.ts
 * @description Ambassador referral tracking — credits, tiers, stats.
 *
 * Uses existing WaitlistEntry referralCode infrastructure.
 * No schema changes required — finds merchant's waitlist entry by email,
 * counts entries where referredBy = their code, calculates credits.
 *
 * Credit tiers:
 *   1–4  active referrals → 1 free month banked per referral
 *   5–9  active referrals → $11/mo subscription credit (ongoing)
 *   10+  active referrals → $55/mo subscription credit (free subscription)
 *
 * Founding members follow same tier but start at $44/mo base.
 */

import { FastifyInstance } from 'fastify'
import { db }              from '../lib/db'

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify() }
  catch { reply.status(401).send({ error: 'Unauthorized' }) }
}

function calculateTier(count: number): {
  tier: string; label: string; monthlyCredit: number; bankedMonths: number; nextTierAt: number | null; nextTierLabel: string | null
} {
  if (count >= 10) return {
    tier: 'elite', label: 'Elite Ambassador',
    monthlyCredit: 55, bankedMonths: 0,
    nextTierAt: null, nextTierLabel: null,
  }
  if (count >= 5) return {
    tier: 'ambassador', label: 'Ambassador',
    monthlyCredit: 11, bankedMonths: 0,
    nextTierAt: 10, nextTierLabel: 'Elite Ambassador — free subscription',
  }
  return {
    tier: 'starter', label: 'Starter',
    monthlyCredit: 0, bankedMonths: count,
    nextTierAt: 5, nextTierLabel: 'Ambassador — $11/mo credit',
  }
}

export async function referralRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth)

  /**
   * GET /api/v1/referrals/stats
   * Returns merchant referral stats, tier, credits, and referral link.
   */
  app.get('/stats', async (req: any, reply) => {
    const merchant = await db.merchant.findUnique({
      where:  { id: req.user.merchantId },
      select: { email: true, plan: true },
    })
    if (!merchant) return reply.status(404).send({ error: 'Merchant not found' })

    // Find the merchant's own waitlist entry to get their referral code
    const waitlistEntry = await (db as any).waitlistEntry.findUnique({
      where: { email: merchant.email },
    })

    if (!waitlistEntry) {
      return reply.send({
        referralCode:  null,
        referralUrl:   null,
        totalReferrals: 0,
        tier: calculateTier(0),
        referrals: [],
      })
    }

    const code = waitlistEntry.referralCode

    // Count all waitlist entries referred by this merchant
    const referrals = await (db as any).waitlistEntry.findMany({
      where:   { referredBy: code },
      select:  { email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    const count = referrals.length
    const tier  = calculateTier(count)

    return reply.send({
      referralCode:   code,
      referralUrl:    `https://netten.app?ref=${code}`,
      totalReferrals: count,
      tier,
      referrals: referrals.map((r: any) => ({
        email:     r.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // mask for privacy
        joinedAt:  r.createdAt,
      })),
    })
  })

  /**
   * GET /api/v1/referrals/leaderboard
   * Top 10 ambassadors by referral count (anonymised).
   */
  app.get('/leaderboard', async (_req: any, reply) => {
    const entries = await (db as any).waitlistEntry.groupBy({
      by:      ['referredBy'],
      where:   { referredBy: { not: null } },
      _count:  { referredBy: true },
      orderBy: { _count: { referredBy: 'desc' } },
      take:    10,
    })

    const board = entries.map((e: any, i: number) => ({
      rank:  i + 1,
      code:  e.referredBy,
      count: e._count.referredBy,
      tier:  calculateTier(e._count.referredBy).label,
    }))

    return reply.send({ leaderboard: board })
  })
}
