// server/src/emails/founding-member-sequence.ts
// Email templates for the founding member sequence

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'jay@netten.app';

interface EmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

const templates = {
  welcome: (firstName: string, spotNumber: number, referralCode: string) => ({
    subject: `You're Founding Member #${spotNumber} — Forever.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0f172a; font-size: 28px; margin-bottom: 24px;">Welcome to NETTEN, ${firstName}.</h1>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">You just locked in spot <strong>#${spotNumber}</strong> of 777 founding members.</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">That number is yours forever. When we launch, you'll pay <strong>$44/month</strong> — locked for life while everyone else pays $55+.</p>
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); border-radius: 12px; padding: 24px; margin: 32px 0;">
          <p style="color: white; font-size: 14px; margin: 0 0 8px 0; opacity: 0.9;">YOUR REFERRAL CODE</p>
          <p style="color: white; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace;">${referralCode}</p>
          <p style="color: white; font-size: 14px; margin: 16px 0 0 0; opacity: 0.9;">Share this → earn $10 RLUSD for every friend who joins</p>
        </div>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">I'm building NETTEN because I was tired of losing 3-5% on every international payment. With RLUSD on the XRP Ledger, settlement is instant and fees are under 1%.</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">More details coming soon. For now, just know — you're in.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px;">— Jay<br/>Founder, NETTEN</p>
      </div>
    `,
  }),
  problemSolution: (firstName: string) => ({
    subject: 'The problem with getting paid in crypto...',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hey ${firstName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Most crypto payment tools have the same problem: they're built for crypto people.</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Your client doesn't want to learn about gas fees. They just want to pay you.</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">NETTEN flips this:</p>
        <ul style="color: #334155; font-size: 16px; line-height: 1.8;">
          <li><strong>Client pays with card, Apple Pay, or bank transfer</strong></li>
          <li><strong>You receive RLUSD instantly</strong> (stablecoin, always $1)</li>
          <li><strong>1% flat fee</strong> — no hidden conversion costs</li>
          <li><strong>Non-custodial</strong> — funds go straight to your wallet</li>
        </ul>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Your clients never touch crypto. You never touch banks.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px;">— Jay</p>
      </div>
    `,
  }),
  benefits: (firstName: string, spotNumber: number) => ({
    subject: 'Your founding member benefits — the full breakdown',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hey ${firstName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">As Founding Member #${spotNumber}, here's what you're locking in:</p>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #0f172a; margin: 0 0 16px 0;">🔒 FOUNDING TIER — $44/mo forever</h3>
          <ul style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>3 months free when we launch</li>
            <li>Price locked for life (regular price: $55+)</li>
            <li>Net Ten rewards (earn RLUSD on every 10th payment)</li>
            <li>Unlimited payment links & invoices</li>
            <li>Priority support + early access to new features</li>
          </ul>
        </div>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Only 777 spots exist. Once they're gone, this tier closes forever.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px;">— Jay</p>
      </div>
    `,
  }),
  caseStudy: (firstName: string) => ({
    subject: 'How a creator made $11,000 without a single bank transfer',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hey ${firstName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Quick story from beta testing:</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">A freelance designer was losing $400-500/month on PayPal fees and currency conversion. She switched to NETTEN for 3 client projects:</p>
        <ul style="color: #334155; font-size: 16px; line-height: 1.8;">
          <li>$11,000 in payments over 6 weeks</li>
          <li>$110 in fees (1% flat)</li>
          <li>Settlement in under 4 seconds</li>
          <li>No chargebacks, no holds, no "pending"</li>
        </ul>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">She kept ~$350 more than she would have with PayPal. Every month.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px;">— Jay</p>
      </div>
    `,
  }),
  urgency: (firstName: string, spotsRemaining: number) => ({
    subject: `${spotsRemaining} founding spots left. This is the last nudge.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hey ${firstName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Not going to spam you. Just a heads up:</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;"><strong>${spotsRemaining} of 777 founding spots remain.</strong></p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">When they're gone, the $44/mo locked rate disappears. New users pay $55+.</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">You're already on the list. When we launch, you'll get first access.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px;">— Jay</p>
      </div>
    `,
  }),
  reengagement: (firstName: string) => ({
    subject: 'Did we lose you?',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hey ${firstName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Haven't heard from you in a while. Totally fine if NETTEN isn't for you.</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">But if you're still interested in getting paid without 3-5% fees, instant settlement, no country restrictions — your founding member spot is still reserved.</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Reply to this email if you have questions. I read everything.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px;">— Jay</p>
      </div>
    `,
  }),
};

export const emailSequence = [
  { step: 0, dayOffset: 0, template: 'welcome' },
  { step: 1, dayOffset: 2, template: 'problemSolution' },
  { step: 2, dayOffset: 5, template: 'benefits' },
  { step: 3, dayOffset: 10, template: 'caseStudy' },
  { step: 4, dayOffset: 14, template: 'urgency' },
  { step: 5, dayOffset: 30, template: 'reengagement' },
] as const;

export async function sendFoundingMemberEmail(
  email: string,
  firstName: string,
  spotNumber: number,
  referralCode: string,
  templateName: string,
  spotsRemaining?: number
): Promise<EmailResult> {
  try {
    let emailContent: { subject: string; html: string };
    switch (templateName) {
      case 'welcome': emailContent = templates.welcome(firstName, spotNumber, referralCode); break;
      case 'problemSolution': emailContent = templates.problemSolution(firstName); break;
      case 'benefits': emailContent = templates.benefits(firstName, spotNumber); break;
      case 'caseStudy': emailContent = templates.caseStudy(firstName); break;
      case 'urgency': emailContent = templates.urgency(firstName, spotsRemaining || 100); break;
      case 'reengagement': emailContent = templates.reengagement(firstName); break;
      default: throw new Error(`Unknown template: ${templateName}`);
    }
    const result = await resend.emails.send({
      from: `Jay from NETTEN <${FROM_EMAIL}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    return { success: true, resendId: result.data?.id };
  } catch (error) {
    console.error('[email] Failed to send:', error);
    return { success: false, error: String(error) };
  }
}
