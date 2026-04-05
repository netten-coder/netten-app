import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'

const notFoundTracker = new Map<string, { count: number; firstSeen: number }>()
const ENUMERATION_THRESHOLD = 20
const ENUMERATION_WINDOW_MS = 5 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of notFoundTracker.entries()) {
    if (now - data.firstSeen > ENUMERATION_WINDOW_MS) {
      notFoundTracker.delete(ip)
    }
  }
}, 60 * 1000)

async function securityPlugin(fastify: FastifyInstance) {
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    reply.removeHeader('X-Powered-By')
    
    if (process.env.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    
    if (request.url.startsWith('/api/')) {
      reply.header('Cache-Control', 'no-store, no-cache, must-revalidate')
    }
  })

  fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip
    const now = Date.now()
    const tracker = notFoundTracker.get(ip)
    
    if (tracker) {
      tracker.count++
      if (tracker.count >= ENUMERATION_THRESHOLD) {
        request.log.warn({ type: 'ENDPOINT_ENUMERATION_DETECTED', ip, count: tracker.count, path: request.url })
        tracker.count = 0
        tracker.firstSeen = now
      }
    } else {
      notFoundTracker.set(ip, { count: 1, firstSeen: now })
    }

    return reply.status(404).send({ error: 'Not Found', message: 'The requested resource does not exist' })
  })
}

export default fp(securityPlugin, { name: 'security-plugin' })
