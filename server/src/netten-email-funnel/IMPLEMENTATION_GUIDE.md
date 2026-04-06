# NETTEN EMAIL FUNNEL — IMPLEMENTATION GUIDE

## Overview

This package contains everything needed to implement your 6-email founding member sequence with:
- ✅ 6 HTML email templates (Day 0, 2, 5, 10, 14, 30)
- ✅ Email scheduler service with auto-timing
- ✅ Prisma schema for tracking
- ✅ API routes for signups and queue processing
- ✅ Live 777 counter component
- ✅ Referral tracking system

---

## PHASE 1: Foundation Setup

### Step 1: Install Dependencies

```bash
cd ~/Desktop/netten/server
npm install resend nanoid
```

### Step 2: Add Prisma Schema

Copy the contents of `schema-additions.prisma` into your existing `prisma/schema.prisma`:

```bash
cat /path/to/schema-additions.prisma >> prisma/schema.prisma
```

### Step 3: Push Database Changes

```bash
npx prisma db push
```

### Step 4: Add Environment Variables to Railway

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
CRON_SECRET=your-secret-for-cron-jobs
```

### Step 5: Verify Resend Domain

1. Go to https://resend.com/domains
2. Add domain: `netten.app`
3. Add the DNS records they provide to your domain (Vercel/Cloudflare)
4. Verify domain status

---

## PHASE 4: Email Funnel Integration

### Step 1: Copy Files to Server

```bash
# Copy email templates
cp founding-member-sequence.ts ~/Desktop/netten/server/src/emails/

# Copy scheduler
cp email-scheduler.ts ~/Desktop/netten/server/src/services/

# Copy API routes
cp api-routes.ts ~/Desktop/netten/server/src/routes/
```

### Step 2: Register Routes in Fastify

In your main `server.ts` or `app.ts`:

```typescript
import emailRoutes from './routes/api-routes';

// ... existing setup

fastify.register(emailRoutes);
```

### Step 3: Set Up Cron Job for Email Queue

**Option A: Railway Cron (Recommended)**

Add to your `railway.json`:
```json
{
  "deploy": {
    "startCommand": "npm start"
  },
  "cron": {
    "processEmails": {
      "schedule": "0 * * * *",
      "command": "curl -X POST https://netten-app-production.up.railway.app/api/email/process-queue -H 'x-cron-secret: YOUR_CRON_SECRET'"
    }
  }
}
```

**Option B: External Cron Service (Cron-job.org)**

1. Go to https://cron-job.org
2. Create job: `POST https://netten-app-production.up.railway.app/api/email/process-queue`
3. Add header: `x-cron-secret: YOUR_CRON_SECRET`
4. Schedule: Every hour

### Step 4: Set Up Resend Webhooks

1. Go to https://resend.com/webhooks
2. Add webhook URL: `https://netten-app-production.up.railway.app/api/email/webhook`
3. Select events: `email.opened`, `email.clicked`, `email.bounced`

---

## FRONTEND: Live 777 Counter

### Step 1: Copy Component

```bash
cp components/LiveSpotCounter.tsx ~/Desktop/netten/apps/web/src/components/
```

### Step 2: Add to Landing Page

In your landing page hero section:

```tsx
import { AnimatedSpotCounter, UrgencyBanner } from '@/components/LiveSpotCounter';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section>
        <h1>NETTEN</h1>
        <AnimatedSpotCounter />
      </section>
      
      {/* Urgency banner - auto shows when < 100 spots */}
      <UrgencyBanner />
    </>
  );
}
```

---

## EMAIL SEQUENCE TIMING

| Email | Day | Trigger |
|-------|-----|---------|
| Welcome | 0 | Immediate on signup |
| Problem Story | 2 | Auto (cron) |
| Benefits Breakdown | 5 | Auto (cron) |
| Case Study | 10 | Auto (cron) |
| Urgency/Referral | 14 | Auto (cron) |
| Re-engagement | 30 | Auto (cron, if inactive) |

---

## TESTING CHECKLIST

### Backend Tests
- [ ] `POST /api/waitlist/join` creates member + sends email
- [ ] `GET /api/waitlist/spots` returns correct count
- [ ] `POST /api/email/process-queue` sends due emails
- [ ] Webhook receives and logs email opens

### Frontend Tests  
- [ ] LiveSpotCounter shows correct number
- [ ] AnimatedSpotCounter animates on load
- [ ] UrgencyBanner appears when < 100 spots

### Email Tests
- [ ] Send test email to yourself
- [ ] Check all 6 templates render correctly
- [ ] Verify {{PLACEHOLDERS}} are replaced
- [ ] Test referral link works

---

## QUICK COMMANDS

```bash
# Push database changes
cd ~/Desktop/netten/server && npx prisma db push

# Test email send (from server console)
npm run dev
# Then hit: POST http://localhost:3001/api/waitlist/join
# Body: { "email": "test@example.com", "firstName": "Test" }

# Manual queue process
curl -X POST http://localhost:3001/api/email/process-queue \
  -H "x-cron-secret: your-secret"

# Check spots
curl http://localhost:3001/api/waitlist/spots
```

---

## TROUBLESHOOTING

### Emails not sending?
1. Check `RESEND_API_KEY` is set in Railway
2. Verify domain is confirmed in Resend
3. Check server logs for errors

### Counter showing wrong number?
1. Ensure database has FoundingMember table
2. Check API route is registered
3. Verify frontend is hitting correct API URL

### Cron not running?
1. Test manual queue process first
2. Check cron secret matches
3. Verify Railway cron is enabled

---

## FILES IN THIS PACKAGE

```
netten-email-funnel/
├── founding-member-sequence.ts  # All 6 email templates
├── email-scheduler.ts           # Auto-send logic
├── api-routes.ts                # Fastify API endpoints
├── schema-additions.prisma      # Database models
├── components/
│   └── LiveSpotCounter.tsx      # Frontend counter
└── IMPLEMENTATION_GUIDE.md      # This file
```

---

## NEXT STEPS AFTER IMPLEMENTATION

1. **Test the full flow**: Sign up → Welcome email → Wait 2 days → Email 2
2. **Monitor open rates** in Resend dashboard
3. **Track referrals** via the referralCode system
4. **A/B test** subject lines once you have volume

Good luck! 🚀
