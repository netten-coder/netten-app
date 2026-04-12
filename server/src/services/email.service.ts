/**
 * NETTEN Email Service
 * 
 * Centralized email sending service using Resend.
 * Handles all transactional and marketing emails.
 */

import { Resend } from 'resend';

// =============================================================================
// CONFIGURATION
// =============================================================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'jay@netten.app';
const FROM_NAME = 'Jay from NETTEN';
const REPLY_TO = 'jay@netten.app';

// =============================================================================
// TYPES
// =============================================================================

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

class EmailService {
  /**
   * Send a single email
   */
  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const result = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo || REPLY_TO,
        tags: options.tags,
      });

      if (result.error) {
        console.error('[email] Send failed:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log(`[email] Sent to ${options.to}: ${options.subject}`);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('[email] Error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send batch emails (up to 100)
   */
  async sendBatch(emails: SendEmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    // Resend batch API allows up to 100 emails
    const batches = [];
    for (let i = 0; i < emails.length; i += 100) {
      batches.push(emails.slice(i, i + 100));
    }

    for (const batch of batches) {
      const batchData = batch.map((email) => ({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo || REPLY_TO,
        tags: email.tags,
      }));

      try {
        const result = await resend.batch.send(batchData);
        
        if (result.error) {
          batch.forEach(() => {
            results.push({ success: false, error: result.error?.message });
          });
        } else {
          result.data?.data.forEach((item) => {
            results.push({ success: true, messageId: item.id });
          });
        }
      } catch (error) {
        batch.forEach(() => {
          results.push({ success: false, error: (error as Error).message });
        });
      }
    }

    return results;
  }

  // ===========================================================================
  // TRANSACTIONAL EMAILS
  // ===========================================================================

  /**
   * Send magic link login email
   */
  async sendMagicLink(to: string, magicLink: string): Promise<EmailResult> {
    return this.send({
      to,
      subject: 'Your NETTEN login link',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 48px; height: 48px; background: #10B981; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-weight: bold; font-size: 20px;">N</span>
            </div>
          </div>
          <h1 style="color: #0f172a; font-size: 24px; text-align: center; margin-bottom: 16px;">Sign in to NETTEN</h1>
          <p style="color: #64748b; font-size: 16px; text-align: center; margin-bottom: 32px;">Click the button below to sign in. This link expires in 15 minutes.</p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background: #10B981; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">Sign in to NETTEN</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px; text-align: center;">If you didn't request this email, you can safely ignore it.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">NETTEN · Crypto payments made simple</p>
        </div>
      `,
      tags: [{ name: 'type', value: 'magic-link' }],
    });
  }

  /**
   * Send payment received notification to merchant
   */
  async sendPaymentReceived(
    to: string,
    merchantName: string,
    amount: string,
    currency: string,
    txHash: string
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: `Payment received: ${amount} ${currency}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #10B981; font-size: 24px; margin-bottom: 8px;">💰 Payment Received!</h1>
          <p style="color: #64748b; font-size: 16px; margin-bottom: 24px;">Hey ${merchantName}, you just received a payment.</p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b;">Amount</span>
              <span style="color: #0f172a; font-weight: 600;">${amount} ${currency}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Transaction</span>
              <a href="https://xrpscan.com/tx/${txHash}" style="color: #10B981; text-decoration: none; font-family: monospace; font-size: 14px;">${txHash.slice(0, 12)}...</a>
            </div>
          </div>
          
          <a href="https://netten.app/dashboard" style="display: inline-block; padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">View Dashboard</a>
        </div>
      `,
      tags: [{ name: 'type', value: 'payment-received' }],
    });
  }

  /**
   * Send Net Ten reward notification
   */
  async sendNetTenReward(
    to: string,
    merchantName: string,
    rewardAmount: string,
    totalCount: number
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: `🎉 Net Ten Reward: ${rewardAmount} RLUSD earned!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 8px;">Net Ten Reward!</h1>
            <p style="color: #64748b; font-size: 16px;">Congratulations ${merchantName}!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 8px 0;">YOU EARNED</p>
            <p style="color: white; font-size: 36px; font-weight: bold; margin: 0;">${rewardAmount} RLUSD</p>
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 16px 0 0 0;">Transaction #${totalCount} • Net Ten Effect</p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">The Net Ten Effect rewards you every 10 transactions. Keep accepting payments to earn more!</p>
        </div>
      `,
      tags: [{ name: 'type', value: 'net-ten-reward' }],
    });
  }

  /**
   * Send subscription renewal reminder
   */
  async sendRenewalReminder(
    to: string,
    merchantName: string,
    amount: string,
    dueDate: string,
    payLink: string
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: `NETTEN subscription due: ${amount} on ${dueDate}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Subscription Renewal</h1>
          <p style="color: #64748b; font-size: 16px; margin-bottom: 24px;">Hey ${merchantName}, your NETTEN subscription is due for renewal.</p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 14px;">Amount Due</span>
              <p style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 4px 0 0 0;">${amount} RLUSD</p>
            </div>
            <div>
              <span style="color: #64748b; font-size: 14px;">Due Date</span>
              <p style="color: #0f172a; font-size: 16px; font-weight: 500; margin: 4px 0 0 0;">${dueDate}</p>
            </div>
          </div>
          
          <a href="${payLink}" style="display: inline-block; padding: 14px 32px; background: #10B981; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">Pay Now</a>
          
          <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">Pay with XRP, RLUSD, or card. Your subscription will continue uninterrupted.</p>
        </div>
      `,
      tags: [{ name: 'type', value: 'renewal-reminder' }],
    });
  }

  /**
   * Send beta tester welcome email
   */
  async sendBetaWelcome(
    to: string,
    contactName: string,
    businessName: string
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: `Welcome to the NETTEN Beta Program!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; padding: 8px 16px; background: #10B981; color: white; border-radius: 20px; font-size: 14px; font-weight: 500;">BETA TESTER</div>
          </div>
          
          <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Welcome to the NETTEN Beta, ${contactName}!</h1>
          
          <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Thank you for joining us as a beta tester for ${businessName}. You're one of just 10 merchants helping us build the future of crypto payments.
          </p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 16px 0;">What's included:</h3>
            <ul style="color: #64748b; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li><strong>Free forever</strong> — No subscription fees, ever</li>
              <li><strong>1% transaction fee</strong> — Same as paid tiers</li>
              <li><strong>Net Ten rewards</strong> — Earn RLUSD on every 10 transactions</li>
              <li><strong>Direct founder access</strong> — I'm here to help</li>
              <li><strong>Weekly check-ins</strong> — 3 weeks of guided testing</li>
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            I'll reach out within 24 hours to schedule your onboarding call. In the meantime, feel free to explore the dashboard.
          </p>
          
          <a href="https://netten.app/dashboard" style="display: inline-block; padding: 14px 32px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">Go to Dashboard</a>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 40px;">— Jay<br/>Founder, NETTEN</p>
        </div>
      `,
      tags: [{ name: 'type', value: 'beta-welcome' }],
    });
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const emailService = new EmailService();
