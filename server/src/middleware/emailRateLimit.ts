import { FastifyRequest, FastifyReply } from 'fastify'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const emailRateLimits = new Map<string, RateLimitEntry>()
const MAX_MAGIC_LINKS_PER_EMAIL = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000  // 10 minutes

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [email, entry] of emailRateLimits.entries()) {
    if (now > entry.resetAt) {
      emailRateLimits.delete(email)
    }
  }
}, 5 * 60 * 1000)

export async function emailRateLimitMiddleware(
  request: FastifyRequest<{ Body: { email?: string } }>,
  reply: FastifyReply
) {
  const email = request.body?.email?.toLowerCase().trim()
  if (!email) return

  const now = Date.now()
  const entry = emailRateLimits.get(email)

  if (entry) {
    if (now > entry.resetAt) {
      emailRateLimits.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    } else if (entry.count >= MAX_MAGIC_LINKS_PER_EMAIL) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
      request.log.warn({ type: 'MAGIC_LINK_RATE_LIMIT', email: email.substring(0, 3) + '***', ip: request.ip })
      return reply.status(429).send({
        error: 'Too many login attempts',
        message: `Please wait ${Math.ceil(retryAfterSeconds / 60)} minutes before requesting another magic link.`,
        retryAfter: retryAfterSeconds
      })
    } else {
      entry.count++
    }
  } else {
    emailRateLimits.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  }
}

export default emailRateLimitMiddleware
