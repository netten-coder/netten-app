// ============================================
// API ROUTES FOR EMAIL FUNNEL
// Add these to your Fastify server
// ============================================

import { FastifyInstance } from 'fastify';
import { 
  registerFoundingMember, 
  getSpotsRemaining,
  processEmailQueue,
  handleEmailOpen 
} from './email-scheduler';

export async function emailRoutes(fastify: FastifyInstance) {
  
  // ============================================
  // POST /api/waitlist/join
  // Register new founding member + send welcome email
  // ============================================
  
  fastify.post('/api/waitlist/join', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          referralCode: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { email, firstName, referralCode } = request.body as any;
    
    try {
      const member = await registerFoundingMember({
        email,
        firstName,
        referralCode
      });
      
      return reply.send({
        success: true,
        spotNumber: member.spotNumber,
        referralCode: member.referralCode,
        referralLink: `https://netten.app?ref=${member.referralCode}`,
        spotsRemaining: 777 - member.spotNumber
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation - email already exists
        return reply.status(400).send({
          success: false,
          error: 'This email is already registered'
        });
      }
      
      if (error.message === 'All founding spots are filled!') {
        return reply.status(400).send({
          success: false,
          error: 'All 777 founding spots have been claimed!'
        });
      }
      
      console.error('Waitlist join error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to join waitlist'
      });
    }
  });
  
  // ============================================
  // GET /api/waitlist/spots
  // Get remaining founding spots (for live counter)
  // ============================================
  
  fastify.get('/api/waitlist/spots', async (request, reply) => {
    try {
      const spotsRemaining = await getSpotsRemaining();
      
      return reply.send({
        total: 777,
        remaining: spotsRemaining,
        claimed: 777 - spotsRemaining
      });
    } catch (error) {
      console.error('Get spots error:', error);
      return reply.status(500).send({ error: 'Failed to get spots' });
    }
  });
  
  // ============================================
  // POST /api/email/process-queue
  // Process email queue (call via cron)
  // Recommended: Run every hour via Railway cron or external service
  // ============================================
  
  fastify.post('/api/email/process-queue', {
    config: {
      // Add authentication for cron job
      // e.g., check for secret header
    }
  }, async (request, reply) => {
    const authHeader = request.headers['x-cron-secret'];
    
    if (authHeader !== process.env.CRON_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    
    try {
      const result = await processEmailQueue();
      
      return reply.send({
        success: true,
        processed: result.processed,
        reengagement: result.reengagement
      });
    } catch (error) {
      console.error('Process queue error:', error);
      return reply.status(500).send({ error: 'Failed to process queue' });
    }
  });
  
  // ============================================
  // POST /api/email/webhook
  // Handle Resend webhooks (email opens, clicks, etc.)
  // ============================================
  
  fastify.post('/api/email/webhook', async (request, reply) => {
    const { type, data } = request.body as any;
    
    try {
      switch (type) {
        case 'email.opened':
          await handleEmailOpen(data.email_id);
          break;
        case 'email.clicked':
          // Track clicks if needed
          break;
        case 'email.bounced':
          // Handle bounces - mark member as inactive
          break;
      }
      
      return reply.send({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return reply.status(500).send({ error: 'Webhook processing failed' });
    }
  });
  
  // ============================================
  // GET /api/waitlist/referral/:code
  // Validate referral code
  // ============================================
  
  fastify.get('/api/waitlist/referral/:code', async (request, reply) => {
    const { code } = request.params as any;
    
    try {
      const referrer = await fastify.prisma.foundingMember.findUnique({
        where: { referralCode: code },
        select: { firstName: true, spotNumber: true }
      });
      
      if (!referrer) {
        return reply.status(404).send({
          valid: false,
          error: 'Invalid referral code'
        });
      }
      
      return reply.send({
        valid: true,
        referrerName: referrer.firstName,
        referrerSpot: referrer.spotNumber
      });
    } catch (error) {
      console.error('Referral validation error:', error);
      return reply.status(500).send({ error: 'Failed to validate referral' });
    }
  });
}

export default emailRoutes;
