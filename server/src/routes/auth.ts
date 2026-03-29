// server/src/routes/auth.ts
import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/login — send magic link
  app.post('/login', async (req, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)

    let merchant = await db.merchant.findUnique({ where: { email } })
    if (!merchant) {
      merchant = await (db.merchant as any).create({ data: { email } })
    }

    const token     = nanoid(32)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await (db.magicToken as any).create({ data: { merchantId: merchant.id, token, expiresAt } })

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@netten.app',
      to: email,
      subject: 'Your Netten login link',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
          <h2 style="color:#041E17;margin-bottom:8px;">Sign in to Netten</h2>
          <p style="color:#64748B;margin-bottom:24px;">Click the button below to sign in. This link expires in 10 minutes.</p>
          <a href="${loginUrl}" style="display:inline-block;background:#1D9E75;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Sign in to Netten →</a>
          <p style="color:#94A3B8;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    })

    return reply.send({ success: true, message: 'Magic link sent' })
  })

  // GET /api/v1/auth/verify?token=xxx
  app.get('/verify', async (req, reply) => {
    const { token } = z.object({ token: z.string() }).parse(req.query)

    const magicToken = await db.magicToken.findUnique({
      where: { token },
      include: { merchant: true }, // sessionPreference included
    })

    if (!magicToken || magicToken.used || magicToken.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Invalid or expired link' })
    }

    await db.magicToken.update({ where: { id: magicToken.id }, data: { used: true } })
    if (!magicToken.merchant.isVerified) {
      await db.merchant.update({ where: { id: magicToken.merchantId }, data: { isVerified: true } })
    }

    const accessToken = app.jwt.sign({ merchantId: magicToken.merchantId }, { expiresIn: '15m' })
    const refreshRaw  = nanoid(64)
    const refreshHash = await bcrypt.hash(refreshRaw, 10)
    const refreshExp  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await (db.refreshToken as any).create({ data: { merchantId: magicToken.merchantId, tokenHash: refreshHash, expiresAt: refreshExp } })

    reply.setCookie('netten_refresh', refreshRaw, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 })
    return reply.send({ accessToken, merchant: magicToken.merchant })
  })

  // POST /api/v1/auth/refresh
  app.post('/refresh', async (req, reply) => {
    const refreshRaw = req.cookies?.netten_refresh
    if (!refreshRaw) return reply.status(401).send({ error: 'No refresh token' })

    const tokens = await db.refreshToken.findMany({ where: { expiresAt: { gt: new Date() } }, take: 50 })
    let validToken = null
    for (const t of tokens) {
      if (await bcrypt.compare(refreshRaw, t.tokenHash)) { validToken = t; break }
    }
    if (!validToken) return reply.status(401).send({ error: 'Invalid refresh token' })

    const accessToken = app.jwt.sign({ merchantId: validToken.merchantId }, { expiresIn: '15m' })
    return reply.send({ accessToken })
  })

  // POST /api/v1/auth/logout
  app.post('/logout', async (req, reply) => {
    reply.clearCookie('netten_refresh')
    return reply.send({ success: true })
  })
}
