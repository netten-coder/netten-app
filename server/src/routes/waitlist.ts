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
      // Resend confirmation to existing member
      try {
        const { Resend } = require('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@netten.app',
          to: email,
          subject: "Your Netten waitlist details 🚀",
          html: \`<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#041E17;color:white;border-radius:16px;">
            <h2 style="color:#7CFF6B;font-family:monospace;letter-spacing:2px;">NETTEN</h2>
            <h3>You're already on the list! ✅</h3>
            <p style="color:#9FE1CB;">Here are your waitlist details.</p>
            <div style="background:rgba(124,255,107,.1);border:1px solid rgba(124,255,107,.3);border-radius:12px;padding:16px;margin:20px 0;">
              <p style="color:#7CFF6B;font-size:12px;letter-spacing:2px;margin:0 0 8px;">YOUR REFERRAL LINK</p>
              <p style="color:white;font-family:monospace;font-size:13px;word-break:break-all;margin:0;">https://netten.app?ref=\${existing.referralCode}</p>
            </div>
            <p style="color:#9FE1CB;font-size:13px;">Share your link to earn rewards when friends join 🚀</p>
            <hr style="border:1px solid rgba(255,255,255,.1);margin:20px 0;"/>
            <p style="color:rgba(255,255,255,.4);font-size:12px;">Netten — Accept any crypto. Settle in RLUSD. Instantly.</p>
          </div>\`
        })
      } catch(e) {}
      return reply.send({ success: true, referralCode: existing.referralCode, count, alreadyJoined: true })
    }
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'NET'
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]

    await (db as any).waitlistEntry.create({
      data: { email, referralCode: code, referredBy: referralCode || null }
    })

    const count = await (db as any).waitlistEntry.count()

    // Send confirmation email
    try {
      const { Resend } = require('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@netten.app',
        to: email,
        subject: "You're on the Netten waitlist! 🚀",
        html: \`<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#041E17;color:white;border-radius:16px;">
          <h2 style="color:#7CFF6B;font-family:monospace;letter-spacing:2px;">NETTEN</h2>
          <h3>You're on the list! 🎉</h3>
          <p style="color:#9FE1CB;">You're one of the founding members of Netten — the crypto payment platform for freelancers, creators and businesses.</p>
          <p style="color:#9FE1CB;">Founding members lock in <strong style="color:#7CFF6B;">$44/mo forever</strong> when we launch.</p>
          <div style="background:rgba(124,255,107,.1);border:1px solid rgba(124,255,107,.3);border-radius:12px;padding:16px;margin:20px 0;">
            <p style="color:#7CFF6B;font-size:12px;letter-spacing:2px;margin:0 0 8px;">YOUR REFERRAL LINK</p>
            <p style="color:white;font-family:monospace;font-size:13px;word-break:break-all;margin:0;">https://netten.app?ref=\${code}</p>
          </div>
          <p style="color:#9FE1CB;font-size:13px;">Share your link — earn rewards when friends join. Bonus details at launch 🚀</p>
          <hr style="border:1px solid rgba(255,255,255,.1);margin:20px 0;"/>
          <p style="color:rgba(255,255,255,.4);font-size:12px;">Netten — Accept any crypto. Settle in RLUSD. Instantly.</p>
        </div>\`
      })
    } catch(e) { /* non-blocking */ }

    return reply.send({ success: true, referralCode: code, count })
  })

  app.get('/waitlist/count', async (_req, reply) => {
    const count = await (db as any).waitlistEntry.count()
    return reply.send({ count })
  })
}
// palindrome build Sun Mar 29 14:00:31 PDT 2026
