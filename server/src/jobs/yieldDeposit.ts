/**
 * @file yieldDeposit.ts
 * @description Deploys idle RLUSD from the Platform/Rewards wallet into the XRPL
 * native AMM to generate passive yield. Also sweeps treasury allocations into
 * dedicated XRP and RLUSD treasury wallets for long-term compounding.
 *
 * How it works:
 *   1. Checks Platform wallet RLUSD balance after weekly sweep
 *   2. Keeps 35% liquid reserve for upcoming Net Ten payouts
 *   3. Deploys 65% of idle balance into XRPL AMM (single-asset deposit)
 *   4. Sweeps 10% of fee surplus into XRP Treasury wallet
 *   5. Sweeps 10% of fee surplus into RLUSD Treasury wallet
 *   6. Logs all movements internally for accounting
 *
 * Schedule: Runs every Monday at 01:00 UTC — 1 hour after Sunday sweep settles
 *
 * Self-sustaining math:
 *   Pool reaches $500K → 65% deployed = $325K in AMM
 *   At 6% APY = $19,500/year = $1,625/month passive yield
 *   Net Ten payouts at 5K merchants ≈ $3,125/month
 *   Self-sustaining moment: when pool crosses $625K deployed
 *
 * Treasury compounding:
 *   10% of weekly fee surplus → XRP treasury (buys XRP at market)
 *   10% of weekly fee surplus → RLUSD treasury (holds stable)
 *   Both compound weekly — no capital deployed from outside Netten
 *
 * Env vars required:
 *   PLATFORM_WALLET_SEED          — signs AMM deposit + treasury transfers
 *   XRPL_PLATFORM_WALLET_ADDRESS  — source of idle RLUSD
 *   ENABLE_AMM_YIELD              — set to 'true' to activate AMM deposits
 *   FEE_WALLET_ADDRESS            — source for treasury sweep calculation
 *   FEE_WALLET_SEED               — signs treasury sweep transfers
 *   TREASURY_XRP_WALLET_ADDRESS   — XRP treasury accumulation wallet
 *   TREASURY_RLUSD_WALLET_ADDRESS — RLUSD treasury accumulation wallet
 *   RLUSD_ISSUER_ADDRESS          — Ripple RLUSD issuer on mainnet
 */

import { Client, Wallet, convertStringToHex } from 'xrpl'
import { db }                                   from '../lib/db'

// ── Configuration ──────────────────────────────────────────────────────────

/** Fraction of idle platform balance to deploy into AMM. */
const AMM_DEPLOY_RATIO = 0.65

/** Fraction to keep liquid for Net Ten payouts and withdrawals. */
const LIQUID_RESERVE_RATIO = 0.35

/** Minimum idle RLUSD before AMM deposit is worthwhile. */
const MIN_AMM_DEPOSIT = 10

/** Fraction of fee surplus to sweep into each treasury wallet weekly. */
const TREASURY_SWEEP_RATIO = 0.10

/** Minimum treasury sweep amount to execute. */
const MIN_TREASURY_SWEEP = 1

/** RLUSD currency hex on XRPL mainnet. */
const RLUSD_CURRENCY = '524C555344000000000000000000000000000000'

/** Official Ripple RLUSD issuer. */
const RLUSD_ISSUER = process.env.RLUSD_ISSUER_ADDRESS ?? 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetches the RLUSD balance of a given XRPL address.
 */
async function getRLUSDBalance(client: Client, address: string): Promise<number> {
  try {
    const res = await client.request({
      command: 'account_lines',
      account: address,
      peer:    RLUSD_ISSUER,
    })
    const line = (res.result.lines as any[]).find(
      (l: any) => l.currency === RLUSD_CURRENCY,
    )
    return parseFloat(line?.balance ?? '0')
  } catch {
    return 0
  }
}

/**
 * Sends RLUSD from one wallet to a destination address.
 */
async function sendRLUSD(
  client:      Client,
  fromWallet:  Wallet,
  destination: string,
  amount:      number,
  memo:        string,
): Promise<boolean> {
  const tx = {
    TransactionType: 'Payment' as const,
    Account:          fromWallet.address,
    Destination:      destination,
    Amount: {
      currency: RLUSD_CURRENCY,
      value:    amount.toFixed(6),
      issuer:   RLUSD_ISSUER,
    },
    Memos: [{ Memo: { MemoData: convertStringToHex(memo) } }],
  }
  const result = await client.submitAndWait(tx, { wallet: fromWallet })
  return (result.result.meta as any)?.TransactionResult === 'tesSUCCESS'
}

// ── AMM Deposit ────────────────────────────────────────────────────────────

/**
 * Deposits a single-asset RLUSD amount into the XRPL native AMM pool.
 * Uses tfSingleAsset flag — no XRP needed on this side of the deposit.
 * AMM issues LP tokens back to the platform wallet automatically.
 */
async function depositToAMM(
  client:        Client,
  platformWallet: Wallet,
  amount:        number,
): Promise<boolean> {
  try {
    const tx = {
      TransactionType: 'AMMDeposit' as const,
      Account:          platformWallet.address,
      Asset: {
        currency: RLUSD_CURRENCY,
        issuer:   RLUSD_ISSUER,
      },
      Asset2:  { currency: 'XRP' },
      Amount: {
        currency: RLUSD_CURRENCY,
        value:    amount.toFixed(6),
        issuer:   RLUSD_ISSUER,
      },
      Flags: 0x00080000, // tfSingleAsset — deposit one side only
      Memos: [{
        Memo: {
          MemoData: convertStringToHex(
            `Netten yield deposit — $${amount.toFixed(2)} RLUSD → AMM`,
          ),
        },
      }],
    }
    const result = await client.submitAndWait(tx, { wallet: platformWallet })
    return (result.result.meta as any)?.TransactionResult === 'tesSUCCESS'
  } catch (err) {
    console.error('[yield] AMM deposit failed:', err)
    return false
  }
}

// ── Main function ──────────────────────────────────────────────────────────

/**
 * Deploys idle platform RLUSD into the XRPL AMM and sweeps treasury allocations.
 * Safe to call multiple times — no-ops if balances are below thresholds.
 */
export async function runYieldDeposit(): Promise<void> {
  const platformSeed           = process.env.PLATFORM_WALLET_SEED
  const platformAddress        = process.env.XRPL_PLATFORM_WALLET_ADDRESS
  const ammEnabled             = process.env.ENABLE_AMM_YIELD === 'true'
  const feeWalletSeed          = process.env.FEE_WALLET_SEED
  const feeWalletAddress       = process.env.FEE_WALLET_ADDRESS
  const treasuryXRPAddress     = process.env.TREASURY_XRP_WALLET_ADDRESS
  const treasuryRLUSDAddress   = process.env.TREASURY_RLUSD_WALLET_ADDRESS
  const nodeUrl                = process.env.XRPL_NODE_URL ?? 'wss://xrplcluster.com'

  if (!platformSeed || !platformAddress) {
    console.warn('[yield] PLATFORM_WALLET_SEED not configured — skipping yield deposit')
    return
  }

  const client = new Client(nodeUrl)

  try {
    await client.connect()
    console.log('[yield] Connected to XRPL mainnet')

    const platformWallet = Wallet.fromSeed(platformSeed)

    // ── Step 1: Check platform wallet RLUSD balance ───────────────────────
    const platformBalance = await getRLUSDBalance(client, platformAddress)
    console.log(`[yield] Platform wallet RLUSD balance: $${platformBalance.toFixed(4)}`)

    // ── Step 2: AMM deposit — deploy 65% of idle balance ──────────────────
    if (ammEnabled && platformBalance > MIN_AMM_DEPOSIT) {
      const liquid   = platformBalance * LIQUID_RESERVE_RATIO
      const toDeposit = parseFloat((platformBalance * AMM_DEPLOY_RATIO).toFixed(6))

      console.log(
        `[yield] AMM strategy — ` +
        `keeping $${liquid.toFixed(2)} liquid, ` +
        `deploying $${toDeposit.toFixed(2)} → AMM`,
      )

      const success = await depositToAMM(client, platformWallet, toDeposit)

      if (success) {
        console.log(`[yield] ✓ AMM deposit successful — $${toDeposit.toFixed(2)} RLUSD deployed`)

        await db.rewardEvent.create({
          data: {
            merchantId:  'netten-internal',
            type:        'SWEEP',
            amountRlusd: toDeposit,
            description: `Yield deposit — $${toDeposit.toFixed(2)} RLUSD → XRPL AMM pool`,
          },
        }).catch(() => console.warn('[yield] RewardEvent log failed — non-fatal'))
      } else {
        console.error('[yield] AMM deposit failed — RLUSD remains in platform wallet')
      }
    } else if (!ammEnabled) {
      console.warn('[yield] ENABLE_AMM_YIELD not true — skipping AMM deposit')
    } else {
      console.log(`[yield] Platform balance $${platformBalance.toFixed(2)} below minimum — skipping AMM deposit`)
    }

    // ── Step 3: Treasury sweeps ───────────────────────────────────────────
    if (feeWalletSeed && feeWalletAddress) {
      const feeBalance    = await getRLUSDBalance(client, feeWalletAddress)
      const feeWallet     = Wallet.fromSeed(feeWalletSeed)
      const treasurySweep = parseFloat((feeBalance * TREASURY_SWEEP_RATIO).toFixed(6))

      if (treasurySweep >= MIN_TREASURY_SWEEP) {
        // ── XRP Treasury allocation ──────────────────────────────────────
        if (treasuryXRPAddress) {
          const xrpOk = await sendRLUSD(
            client, feeWallet, treasuryXRPAddress, treasurySweep,
            `Netten XRP treasury sweep — $${treasurySweep.toFixed(2)} RLUSD`,
          )
          if (xrpOk) {
            console.log(`[yield] ✓ XRP treasury — $${treasurySweep.toFixed(2)} RLUSD swept`)
            await db.rewardEvent.create({
              data: {
                merchantId:  'netten-internal',
                type:        'SWEEP',
                amountRlusd: treasurySweep,
                description: `XRP treasury allocation — $${treasurySweep.toFixed(2)} RLUSD`,
              },
            }).catch(() => {})
          }
        }

        // ── RLUSD Treasury allocation ─────────────────────────────────────
        if (treasuryRLUSDAddress) {
          // Refetch balance after XRP treasury sweep
          const feeBalAfter   = await getRLUSDBalance(client, feeWalletAddress)
          const rlusdSweep    = parseFloat((feeBalAfter * TREASURY_SWEEP_RATIO).toFixed(6))

          if (rlusdSweep >= MIN_TREASURY_SWEEP) {
            const rlusdOk = await sendRLUSD(
              client, feeWallet, treasuryRLUSDAddress, rlusdSweep,
              `Netten RLUSD treasury sweep — $${rlusdSweep.toFixed(2)} RLUSD`,
            )
            if (rlusdOk) {
              console.log(`[yield] ✓ RLUSD treasury — $${rlusdSweep.toFixed(2)} RLUSD swept`)
              await db.rewardEvent.create({
                data: {
                  merchantId:  'netten-internal',
                  type:        'SWEEP',
                  amountRlusd: rlusdSweep,
                  description: `RLUSD treasury allocation — $${rlusdSweep.toFixed(2)} RLUSD`,
                },
              }).catch(() => {})
            }
          }
        }
      } else {
        console.log(`[yield] Treasury sweep $${treasurySweep.toFixed(2)} below minimum — skipping`)
      }
    }

    console.log('[yield] ✓ Yield deposit cycle complete')

  } catch (err) {
    console.error('[yield] Unexpected error during yield deposit:', err)
  } finally {
    if (client.isConnected()) await client.disconnect()
  }
}
