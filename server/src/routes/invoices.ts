// server/src/routes/invoices.ts
import { FastifyInstance } from 'fastify'
import { db } from '../lib/db'
import { resend } from '../lib/resend'
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

  app.get('/:id', async (req: any, reply) => {
    const invoice = await db.invoice.findFirst({
      where: { id: req.params.id, merchantId: req.user.merchantId },
      include: { merchant: { select: { businessName: true, email: true } } },
    })
    if (!invoice) return reply.status(404).send({ error: 'Not found' })
    return invoice
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

    const merchantId = req.user.merchantId
    const count = await db.invoice.count({ where: { merchantId } })
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`

    const slug = nanoid(10)
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${slug}`
    const payLink = await (db as any).paymentLink.create({
      data: {
        merchantId, slug, url,
        description: `Invoice ${invoiceNumber}${data.description ? ` — ${data.description}` : ''}`,
        amountUsd: data.amountUsd,
        acceptedCoins: data.acceptedCoins,
        maxUses: 1,
        expiresAt: data.dueDate ? new Date(new Date(data.dueDate).getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
      },
    })

    const invoice = await (db.invoice as any).create({
      data: {
        ...data,
        merchantId,
        invoiceNumber,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: JSON.stringify({ payLinkSlug: payLink.slug, payLinkUrl: payLink.url, userNotes: data.notes || '' }),
      },
    })

    return { ...invoice, payLinkSlug: payLink.slug, payLinkUrl: payLink.url }
  })

  app.post('/:id/send', async (req: any, reply) => {
    const invoice = await db.invoice.findFirst({
      where: { id: req.params.id, merchantId: req.user.merchantId },
      include: { merchant: { select: { businessName: true, email: true } } },
    })
    if (!invoice) return reply.status(404).send({ error: 'Invoice not found' })
    if (!invoice.clientEmail) return reply.status(400).send({ error: 'No client email on this invoice' })

    let payLinkUrl = ''
    try { const meta = JSON.parse(invoice.notes || '{}'); payLinkUrl = meta.payLinkUrl || '' } catch { }

    const merchantName = invoice.merchant?.businessName || invoice.merchant?.email || 'Your merchant'
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Upon receipt'

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@netten.app',
      to: invoice.clientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${merchantName} — $${invoice.amountUsd.toFixed(2)} due`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Helvetica,Arial,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);"><div style="background:#041E17;padding:24px 32px;"><span style="color:white;font-size:20px;font-weight:600;">Netten</span></div><div style="padding:32px;"><p style="color:#64748B;font-size:13px;margin:0 0 4px;">Invoice from</p><h2 style="color:#0F172A;font-size:20px;font-weight:700;margin:0 0 20px;">${merchantName}</h2><table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;width:130px;">Invoice</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#0F172A;font-size:13px;font-weight:600;">${invoice.invoiceNumber}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;">Billed to</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#0F172A;font-size:13px;">${invoice.clientName}</td></tr>${invoice.description ? `<tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;">Description</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#0F172A;font-size:13px;">${invoice.description}</td></tr>` : ''}<tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;">Due date</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#0F172A;font-size:13px;">${dueDate}</td></tr></table><div style="background:#F8FAFC;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;"><span style="color:#64748B;font-size:14px;">Amount due</span><span style="color:#0F172A;font-size:24px;font-weight:700;">$${invoice.amountUsd.toFixed(2)}</span></div>${payLinkUrl ? `<div style="text-align:center;margin-bottom:24px;"><a href="${payLinkUrl}" style="display:inline-block;background:#1D9E75;color:white;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">Pay $${invoice.amountUsd.toFixed(2)} now →</a><p style="color:#94A3B8;font-size:11px;margin:10px 0 0;">Pay in any crypto · Settles in RLUSD on XRP Ledger</p></div>` : ''}<p style="color:#CBD5E1;font-size:11px;text-align:center;margin:0;">Powered by Netten · netten.app</p></div></div></body></html>`,
    })

    return { success: true, sentTo: invoice.clientEmail }
  })

  app.delete('/:id', async (req: any) => {
    await db.invoice.update({ where: { id: req.params.id, merchantId: req.user.merchantId }, data: { status: 'CANCELLED' } })
    return { success: true }
  })
}
