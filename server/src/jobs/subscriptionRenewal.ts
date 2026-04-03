// server/src/jobs/subscriptionRenewal.ts

import { addMonths } from 'date-fns'
import { db } from '../lib/db'
import { resend } from '../lib/resend'
import { nanoid } from 'nanoid'

const PLAN_AMOUNTS: Record<string, number> = {
  FOUNDING: 44,
  PRO:      59,
  STUDIO:   99,
}

export async function sendRenewalPayLinks(): Promise<void> {
  const now  = new Date()
  const due  = await db.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL'] }, nextDueDate: { lte: now } },
    include: { merchant: true },
  })

  console.log(`[renewal] Processing ${due.length} due subscriptions`)

  for (const sub of due) {
    const { merchant } = sub
    const amount     = PLAN_AMOUNTS[sub.plan] ?? Number(sub.monthlyAmount)
    const slug       = nanoid(10)
    const url        = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${slug}`
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    await (db as any).paymentLink.create({
      data: {
        merchantId:    merchant.id,
        slug,
        url,
        description:   `Netten ${sub.plan} Subscription — ${monthLabel}`,
        amountUsd:     amount,
        acceptedCoins: ['XRP', 'RLUSD'],
        maxUses:       1,
        expiresAt:     new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      },
    })

    await resend.emails.send({
      from:    process.env.EMAIL_FROM ?? 'noreply@netten.app',
      to:      merchant.email,
      subject: `Your Netten ${sub.plan} subscription is due — ${monthLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
          <h2 style="color:#041E17;">Hi ${merchant.businessName ?? merchant.email.split('@')[0]} 👋</h2>
          <p style="color:#64748B;margin-bottom:24px;">
            Your <strong>${sub.plan} plan</strong> of <strong>$${amount}/month</strong> is due for ${monthLabel}.
          </p>
          <a href="${url}" style="display:inline-block;background:#1D9E75;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;">
            Pay $${amount} now →
          </a>
          <p style="color:#94A3B8;font-size:12px;margin-top:24px;">
            You have a 10-day grace period before your account is paused.
          </p>
        </div>
      `,
    })

    await db.subscription.update({
      where: { id: sub.id },
      data: {
        status:        'GRACE',
        gracePeriodEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      },
    })

    console.log(`[renewal] Sent — merchantId=${merchant.id}`)
  }
}

export async function pauseExpiredAccounts(): Promise<void> {
  const now = new Date()
  const expired = await db.subscription.findMany({
    where: { status: 'GRACE', gracePeriodEnd: { lte: now } },
  })

  for (const sub of expired) {
    await db.subscription.update({ where: { id: sub.id }, data: { status: 'PAUSED' } })
    await db.merchant.update({ where: { id: sub.merchantId }, data: { isActive: false } })
    console.log(`[renewal] Account paused — merchantId=${sub.merchantId}`)
  }
}

export async function suspendAbandonedAccounts(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const paused = await db.subscription.findMany({
    where: { status: 'PAUSED', updatedAt: { lte: thirtyDaysAgo } },
  })

  for (const sub of paused) {
    await db.subscription.update({ where: { id: sub.id }, data: { status: 'SUSPENDED' } })
    console.log(`[renewal] Account suspended — merchantId=${sub.merchantId}`)
  }
}
