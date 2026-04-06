// server/src/routes/email-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerFoundingMember, getSpotsRemaining, processEmailQueue, handleEmailOpen, handleEmailClick, handleEmailBounce } from '../services/email-scheduler';

interface JoinWaitlistBody { email: string; firstName: string; referralCode?: string; }
interface ResendWebhookBody { type: string; data: { email_id: string; to: string[] }; }

export async function emailRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: JoinWaitlistBody }>('/waitlist/join', async (request, reply) => {
    const { email, firstName, referralCode } = request.body;
    if (!email || !firstName) return reply.status(400).send({ success: false, error: 'Email and firstName are required' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return reply.status(400).send({ success: false, error: 'Invalid email format' });

    const result = await registerFoundingMember(email, firstName, referralCode);
    if (result.success) {
      return reply.status(201).send({ success: true, spotNumber: result.spotNumber, referralCode: result.referralCode, message: `Welcome! You are Founding Member #${result.spotNumber}` });
    } else {
      return reply.status(result.error === 'Email already registered' ? 409 : 400).send({ success: false, error: result.error, spotNumber: result.spotNumber, referralCode: result.referralCode });
    }
  });

  app.get('/waitlist/spots', async (_request, reply) => {
    const remaining = await getSpotsRemaining();
    return reply.send({ total: 777, remaining, claimed: 777 - remaining });
  });

  app.post('/process-queue', async (request, reply) => {
    const cronSecret = request.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET) return reply.status(401).send({ error: 'Unauthorized' });
    const result = await processEmailQueue();
    return reply.send({ success: true, processed: result.processed, errors: result.errors, timestamp: new Date().toISOString() });
  });

  app.post<{ Body: ResendWebhookBody }>('/webhook', async (request, reply) => {
    const { type, data } = request.body;
    const emailId = data?.email_id;
    if (!emailId) return reply.status(400).send({ error: 'Missing email_id' });
    let handled = false;
    switch (type) {
      case 'email.opened': handled = await handleEmailOpen(emailId); break;
      case 'email.clicked': handled = await handleEmailClick(emailId); break;
      case 'email.bounced': case 'email.complained': handled = await handleEmailBounce(emailId); break;
      default: handled = true;
    }
    return reply.send({ received: true, handled });
  });

  app.get('/health', async (_request, reply) => {
    return reply.send({ status: 'ok', service: 'email-funnel', config: { resendConfigured: !!process.env.RESEND_API_KEY, cronConfigured: !!process.env.CRON_SECRET }, timestamp: new Date().toISOString() });
  });
}
