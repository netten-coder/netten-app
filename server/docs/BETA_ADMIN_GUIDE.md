# NETTEN Beta Tester Admin Guide

## Quick Start

### 1. Apply Schema Migration
```bash
cd server
npx prisma db push
```

### 2. Add Your Beta Testers

#### Option A: Using the Admin Script
```bash
# Add a new beta tester (before they sign up)
npx ts-node scripts/beta-admin.ts add "friend@email.com" "Friend's Hoodie Shop" "Friend Name" "Apparel"

# Upgrade an existing merchant to beta
npx ts-node scripts/beta-admin.ts upgrade "existing@merchant.com"

# List all beta testers
npx ts-node scripts/beta-admin.ts list
```

#### Option B: Using Railway Console (Direct SQL)
1. Go to Railway Dashboard → netten-app → Database
2. Click "Connect" → "Query"
3. Run:

```sql
-- Add beta tester
INSERT INTO "BetaTester" (
  id, email, "businessName", "businessType", "contactName", 
  status, "startDate", "endDate", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'friend@example.com',
  'Friend''s Hoodie Shop',
  'Apparel',
  'Friend Name',
  'INVITED',
  NOW(),
  NOW() + INTERVAL '21 days',
  NOW(),
  NOW()
);
```

---

## Weekly Check-in Commands

### Week 1 Check-in
```bash
npx ts-node scripts/beta-admin.ts checkin "tester@email.com" 1 "Completed setup, first 2 transactions processed"
```

### Week 2 Check-in
```bash
npx ts-node scripts/beta-admin.ts checkin "tester@email.com" 2 "Active usage, no major issues"
```

### Week 3 Check-in (Final)
```bash
npx ts-node scripts/beta-admin.ts checkin "tester@email.com" 3 "Great experience, wants to continue"
```

---

## Complete Beta & Grant Lifetime Free

```bash
npx ts-node scripts/beta-admin.ts complete "tester@email.com" "NETTEN made crypto payments super easy!"
```

This will:
- Mark beta as COMPLETED
- Grant lifetime FREE_BETA tier
- Record their testimonial

---

## Your Current Beta Testers

| # | Business | Contact | Email | Status |
|---|----------|---------|-------|--------|
| 1 | TBD | TBD | TBD | 🟡 Pending |
| 2 | Hoodie/Shirt Shop | Your Friend | TBD | 🟡 In Principle |

**Goal: 10 active beta merchants by launch**

---

## Beta Tester Flow

```
1. INVITED     → You add them to BetaTester table
2. ONBOARDING  → They sign up on netten.app
3. ACTIVE      → You upgrade their Merchant to FREE_BETA
4. Week 1      → Check-in: Setup complete?
5. Week 2      → Check-in: Active usage?
6. Week 3      → Check-in: Final review
7. COMPLETED   → Grant lifetime free access
```

---

## Tier Reference

| Tier | Price | Spots | Notes |
|------|-------|-------|-------|
| FREE_BETA | $0 forever | 10 | Beta testers only |
| EARLY_ADOPTER | $33/mo forever | 55 | First waitlist converts |
| FOUNDING | $44/mo forever | 777 | Main launch tier |
| STARTER | $55/mo | ∞ | Standard tier |
| PRO | $77/mo | ∞ | + Invoicing, CSV |
| BUSINESS | $99/mo | ∞ | + Webhooks, API, Teams |
| ENTERPRISE | $999/mo | Custom | White label |

**All tiers: 1% transaction fee (non-negotiable)**
