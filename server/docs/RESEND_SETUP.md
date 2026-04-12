# NETTEN Resend Email Setup

## Overview

NETTEN uses [Resend](https://resend.com) for transactional emails:
- Magic link authentication
- Payment notifications
- Net Ten reward alerts
- Subscription renewals
- Beta tester onboarding

---

## Setup Steps

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

### 2. Add & Verify Domain

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter: `netten.app`
4. Add the DNS records Resend provides:

```
Type    Name                Value
TXT     @                   v=spf1 include:_spf.resend.com ~all
TXT     resend._domainkey   [provided by Resend]
TXT     _dmarc              v=DMARC1; p=none; rua=mailto:dmarc@netten.app
```

**Note:** You already have ImprovMX configured. The SPF record should be:
```
v=spf1 include:spf.improvmx.com include:_spf.resend.com ~all
```

### 3. Get API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: `netten-production`
4. Full access: ✅
5. Copy the key (starts with `re_`)

### 4. Add to Railway

```bash
# Via Railway CLI
railway variables set RESEND_API_KEY=re_xxxxxxxxxxxx

# Or in Railway Dashboard:
# Project → netten-app → Variables → Add
```

Also add:
```env
EMAIL_FROM=jay@netten.app
```

### 5. Test Email Sending

```bash
# In server directory
npx ts-node -e "
import { emailService } from './src/services/email.service';

emailService.sendMagicLink('your-email@example.com', 'https://netten.app/test')
  .then(console.log)
  .catch(console.error);
"
```

---

## Email Types

| Email | Trigger | Template |
|-------|---------|----------|
| Magic Link | Login request | `sendMagicLink()` |
| Payment Received | Transaction completed | `sendPaymentReceived()` |
| Net Ten Reward | Every 10th transaction | `sendNetTenReward()` |
| Renewal Reminder | Subscription due | `sendRenewalReminder()` |
| Beta Welcome | Beta upgrade | `sendBetaWelcome()` |
| Founding Sequence | Waitlist signup | `founding-member-sequence.ts` |

---

## Usage Examples

```typescript
import { emailService } from './services/email.service';

// Send magic link
await emailService.sendMagicLink(
  'merchant@example.com',
  'https://netten.app/auth/verify?token=xxx'
);

// Send payment notification
await emailService.sendPaymentReceived(
  'merchant@example.com',
  'Acme Corp',
  '100.00',
  'RLUSD',
  'ABC123...'
);

// Send Net Ten reward
await emailService.sendNetTenReward(
  'merchant@example.com',
  'Acme Corp',
  '0.25',
  10
);

// Send beta welcome
await emailService.sendBetaWelcome(
  'beta@example.com',
  'John',
  'John\'s Coffee Shop'
);
```

---

## DNS Records Summary

After setup, your DNS should have:

```
# ImprovMX (existing)
MX  @   mx1.improvmx.com (priority 10)
MX  @   mx2.improvmx.com (priority 20)
TXT @   v=spf1 include:spf.improvmx.com include:_spf.resend.com ~all

# Resend
TXT resend._domainkey   [DKIM key from Resend]

# DMARC
TXT _dmarc   v=DMARC1; p=none; rua=mailto:dmarc@netten.app
```

---

## Troubleshooting

**"API key not found" error:**
- Check `RESEND_API_KEY` is set in Railway
- Verify key starts with `re_`

**"Domain not verified" error:**
- Check DNS records in Cloudflare/your DNS provider
- Wait up to 24 hours for propagation
- Re-verify in Resend dashboard

**Emails going to spam:**
- Ensure SPF, DKIM, and DMARC are configured
- Use consistent "from" address
- Avoid spammy subject lines

**Rate limits:**
- Free tier: 100 emails/day
- Pro tier: 50,000 emails/month
- Upgrade at resend.com/pricing if needed

---

## Environment Variables

```env
# Required
RESEND_API_KEY=re_xxxxxxxxxxxx

# Optional (defaults shown)
EMAIL_FROM=jay@netten.app
```

---

## Monitoring

View email logs in Resend dashboard:
- **Emails** → See all sent emails
- **Logs** → Delivery status, bounces, complaints
- **Analytics** → Open rates, click rates

---

## Security Notes

- Never commit `RESEND_API_KEY` to git
- Use environment variables only
- Rotate key if compromised
- Monitor for unusual sending patterns
