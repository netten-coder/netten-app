# Netten

**Accept any payment. Settle in RLUSD. Instantly.**

Netten is a merchant payment platform built on the XRP Ledger. Accept any cryptocurrency, settle instantly in RLUSD (Ripple's NYDFS-regulated stablecoin). Built for mainstream businesses — law firms, agencies, restaurants, SaaS, freelancers.

> "Netten" — a palindrome. Net ten. Every 10 transactions nets you back RLUSD rewards.

**Built by Jermaine Ulinwa · jermaine@netten.app · netten.app**

---

## What's in this repo

```
netten/
├── server/                   # Node.js + Fastify API
│   ├── prisma/schema.prisma  # Database schema
│   └── src/
│       ├── index.ts          # Server entry
│       ├── lib/db.ts         # Prisma client
│       ├── services/
│       │   ├── xrpl.ts       # XRP Ledger payment monitoring
│       │   ├── alchemy-pay.ts# Crypto → RLUSD conversion
│       │   ├── rewards.ts    # Graduated rewards engine
│       │   ├── auth.ts       # Magic link authentication
│       │   └── webhook.ts    # Merchant webhooks
│       └── routes/           # API endpoints
│
├── apps/web/                 # Next.js 14 merchant dashboard
│   └── src/app/
│       ├── onboarding/       # 5-step merchant onboarding
│       ├── pay/[slug]/       # 3-step customer payment (zero data collected)
│       └── dashboard/        # Full merchant dashboard
│
├── apps/mobile/              # React Native (Expo) QR POS
│
└── DEPLOYMENT.md             # Step-by-step deployment guide
```

---

## Quick start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Fill in your values (see DEPLOYMENT.md)

# Create database tables
pnpm db:push

# Start API + web dashboard
pnpm dev
```

---

## The Netten Rewards Engine

**Stealth. Graduated. Compounding.**

- Q1 (months 1–3): $0.25 RLUSD per 10 transactions
- Q2 (months 4–6): $0.50 RLUSD per 10 transactions
- Q3 (months 7–9): $1.00 RLUSD per 10 transactions
- Q4 (months 10+): $2.00 RLUSD per 10 transactions (permanent cap)

Not advertised. Merchants discover it organically. Each doubling is a discovery moment.

---

## Privacy first

- Zero customer data collected — ever
- No customer name, email, or wallet address stored
- Payment identified by XRPL transaction hash only
- CSV Audit Tracker ($21/mo add-on) generated client-side, saved to merchant device

---

## Pricing

| Plan | Monthly | Txn fee |
|------|---------|---------|
| Starter | $55/mo | 1% |
| Pro | $99/mo | 1% |
| Business | $299/mo | 1% |
| Enterprise | $999/mo | 0.25% |
| Audit Tracker add-on | +$21/mo | — |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| API | Node.js + Fastify + TypeScript |
| Database | PostgreSQL (Supabase) + Prisma |
| Blockchain | xrpl.js + XRPL mainnet |
| Settlement | Alchemy Pay (RLUSD) |
| Auth | Magic links via Resend |
| Web | Next.js 14 + Tailwind CSS |
| Mobile | React Native + Expo |
| Hosting | Railway (API) + Vercel (web) |

---

*Netten — The palindrome that pays you back.*
