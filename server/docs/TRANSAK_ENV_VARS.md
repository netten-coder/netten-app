# NETTEN Transak Integration — Environment Variables

## Required for Transak Webhook + XRPL DEX

Add these to your Railway environment variables:

```env
# ============================================================================
# TRANSAK (Card Payments)
# ============================================================================

# Get these from Transak Partner Dashboard after account unlock
TRANSAK_API_KEY=your_api_key_here
TRANSAK_SECRET_KEY=your_secret_key_here
TRANSAK_WEBHOOK_SECRET=your_webhook_secret_here

# ============================================================================
# XRPL DEX (XRP → RLUSD Swaps)
# ============================================================================

# WebSocket endpoint (mainnet)
XRPL_WSS=wss://xrplcluster.com

# Platform wallet — receives XRP from Transak, swaps to RLUSD
# This is your main operational wallet
PLATFORM_WALLET_ADDRESS=rDQzhMQbsNn6yefNMTj34rMHnHokYV6otH
PLATFORM_WALLET_SECRET=sXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # KEEP SECRET!

# Fee collection wallet — receives 1% fee in RLUSD
# Can be same as platform wallet or separate
FEE_WALLET_ADDRESS=rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ============================================================================
# ALREADY CONFIGURED (verify these exist)
# ============================================================================

# RLUSD issuer (mainnet) — should already be set
RLUSD_ISSUER_ADDRESS=rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De

# XRPL seed for existing service (Net Ten rewards)
XRPL_PLATFORM_WALLET_SEED=sXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Transak Dashboard Setup

Once your Transak account is unlocked:

1. **Login:** https://partners.transak.com
2. **Get API Keys:** Settings → API Keys
3. **Set Webhook URL:** Settings → Webhooks
   - URL: `https://netten-app-production.up.railway.app/webhooks/transak`
   - Events: Select all order events
4. **Copy Webhook Secret:** Used for signature verification

---

## One-Time Setup Commands

Before processing payments, run these once:

```bash
# 1. Ensure platform wallet has RLUSD trustline
# Run via Railway console or local with env vars:
npx ts-node -e "
import { xrplDexService } from './src/services/xrpl-dex.service';
xrplDexService.setupRlusdTrustline().then(console.log);
"

# 2. Verify environment variables in Railway
railway variables
```

---

## Webhook Endpoint

| Method | URL | Auth |
|--------|-----|------|
| POST | `/webhooks/transak` | Signature verified |
| GET | `/webhooks/transak/health` | None |

---

## Testing the Webhook

```bash
# Health check
curl https://netten-app-production.up.railway.app/webhooks/transak/health

# Expected response:
# {"status":"healthy","service":"transak-webhook","timestamp":"..."}
```

---

## Security Checklist

- [ ] PLATFORM_WALLET_SECRET is in Railway, NOT in code
- [ ] TRANSAK_WEBHOOK_SECRET is in Railway
- [ ] Webhook URL uses HTTPS
- [ ] Rate limiting enabled on Fastify
- [ ] CORS allows Transak domains

---

## Troubleshooting

**"Missing signature" error:**
- Transak webhook request doesn't have `x-transak-signature` header
- Check Transak dashboard webhook configuration

**"Invalid signature" error:**
- TRANSAK_WEBHOOK_SECRET doesn't match
- Re-copy the secret from Transak dashboard

**"Payment not found" error:**
- partnerOrderId doesn't match any PaymentLink or Transaction
- Ensure payment was created before Transak redirect

**XRPL connection failed:**
- Check XRPL_WSS endpoint is reachable
- Try alternative: `wss://s1.ripple.com` or `wss://s2.ripple.com`
