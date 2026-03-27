# Netten — Deployment Guide

> Accept any crypto. Settle in RLUSD. Instantly.

---

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (free tier works)
- A [Vercel](https://vercel.com) account
- A [Railway](https://railway.app) account
- A [Resend](https://resend.com) account (for magic link emails)
- GitHub repo with this code pushed to `main`

---

## 1. Set up the database (Supabase)

1. Create a new Supabase project at https://app.supabase.com
2. Go to **Settings → Database → Connection string** and copy the URI
3. Replace `[YOUR-PASSWORD]` in the URI with your database password
4. Save this as your `DATABASE_URL`

Run migrations:

```bash
cd server
DATABASE_URL="your-connection-string" npx prisma db push
```

---

## 2. Configure environment variables

### Server (`server/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
MAGIC_LINK_SECRET=another-secret-for-cookies

# App URL (your Vercel deployment URL)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Server
PORT=3001
NODE_ENV=production
```

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://your-railway-api.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 3. Deploy the API → Railway

1. Go to https://railway.app → New Project → Deploy from GitHub repo
2. Select your repository, set **Root Directory** to `server`
3. Add all server environment variables in Railway's **Variables** tab
4. Railway will auto-detect Node.js and run `pnpm start`
5. Copy your Railway deployment URL (e.g. `https://netten-api.up.railway.app`)

---

## 4. Deploy the Web App → Vercel

1. Go to https://vercel.com → New Project → Import from GitHub
2. Set **Root Directory** to `apps/web`
3. Set **Framework** to `Next.js`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` → your Railway API URL
   - `NEXT_PUBLIC_APP_URL` → your Vercel app URL (e.g. `https://netten.vercel.app`)
5. Click **Deploy**

---

## 5. Set up GitHub Actions CI/CD (automatic deploys)

Add these secrets to your GitHub repo (**Settings → Secrets → Actions**):

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `RAILWAY_TOKEN` | Railway → Account → API Tokens |
| `NEXT_PUBLIC_API_URL` | Your Railway deployment URL |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

After adding secrets, every push to `main` will automatically:
1. Type-check and lint both server and web
2. Build the Next.js app
3. Deploy web → Vercel
4. Deploy API → Railway

---

## 6. Connect your XRPL wallet

1. Sign in to your Netten dashboard
2. Go to **Settings → XRPL Settlement Wallet**
3. Either paste an existing XRPL address or click **Generate new wallet**
4. If generating: **save the seed phrase immediately** — it's shown once
5. Click **Save wallet**

Your wallet now receives RLUSD for every completed payment.

---

## 7. Test a payment end-to-end

1. Go to **Pay Links → New Link**
2. Set a description and amount (e.g. "Test payment", $5.00)
3. Copy the link URL and open it in a new tab (or mobile)
4. Select a coin and scan/copy the payment address
5. Send the crypto from a test wallet
6. Watch the **Payments** dashboard for the confirmed transaction

---

## Architecture overview

```
Customer → /pay/[slug]  (Next.js, Vercel)
                ↓
         Netten API  (Fastify, Railway)
                ↓
         Supabase PostgreSQL (via Prisma)
                ↓
         XRP Ledger (RLUSD settlement)
```

---

## Local development

```bash
# Install deps
pnpm install

# Start server (port 3001)
pnpm dev:api

# Start web (port 3000)
pnpm dev:web

# Or both together
pnpm dev
```

Visit http://localhost:3000

---

## Troubleshooting

**Magic link emails not sending**
- Check `RESEND_API_KEY` is set and valid
- Verify `EMAIL_FROM` domain is verified in Resend

**"Unauthorized" errors in dashboard**
- Check `JWT_SECRET` matches between server restarts
- Clear cookies and log in again

**Prisma migration errors**
- Run `npx prisma generate` in the `server/` directory
- Ensure `DATABASE_URL` is correct and accessible

**XRPL connection failed on startup**
- This is non-fatal — the API still runs
- XRPL connects to wss://s1.ripple.com by default

---

*Built with Next.js · Fastify · Prisma · Supabase · XRPL*
