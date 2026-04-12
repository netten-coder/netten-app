-- ============================================================================
-- NETTEN BETA TESTER SQL COMMANDS
-- Quick reference for manual database operations
-- ============================================================================

-- ============================================================================
-- 1. ADD A NEW BETA TESTER (before they sign up)
-- ============================================================================

INSERT INTO "BetaTester" (
  id, email, "businessName", "businessType", "contactName", 
  status, "startDate", "endDate", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'friend@example.com',           -- Replace with tester's email
  'Friend''s Hoodie Shop',        -- Replace with business name
  'Apparel',                      -- Business type
  'Friend Name',                  -- Contact name
  'INVITED',
  NOW(),
  NOW() + INTERVAL '21 days',     -- 3 week beta period
  NOW(),
  NOW()
);


-- ============================================================================
-- 2. UPGRADE EXISTING MERCHANT TO BETA TESTER
-- ============================================================================

-- First, update the Merchant record
UPDATE "Merchant" SET
  tier = 'FREE_BETA',
  "isBetaTester" = true,
  "betaStartDate" = NOW(),
  "betaEndDate" = NOW() + INTERVAL '21 days',
  "betaWeeklyCheckin" = 0,
  "updatedAt" = NOW()
WHERE email = 'merchant@example.com';  -- Replace with actual email


-- ============================================================================
-- 3. LIST ALL BETA TESTERS
-- ============================================================================

SELECT 
  email, 
  "businessName", 
  status, 
  "startDate", 
  "endDate",
  "totalTransactions",
  "totalVolume",
  CASE 
    WHEN "week1CheckIn" IS NOT NULL THEN '✓' ELSE '○' 
  END as week1,
  CASE 
    WHEN "week2CheckIn" IS NOT NULL THEN '✓' ELSE '○' 
  END as week2,
  CASE 
    WHEN "week3CheckIn" IS NOT NULL THEN '✓' ELSE '○' 
  END as week3
FROM "BetaTester"
ORDER BY "createdAt" DESC;


-- ============================================================================
-- 4. RECORD WEEKLY CHECK-IN
-- ============================================================================

-- Week 1 check-in
UPDATE "BetaTester" SET
  "week1CheckIn" = NOW(),
  "week1Notes" = 'Completed onboarding, processed first 2 transactions',
  status = 'ACTIVE',
  "updatedAt" = NOW()
WHERE email = 'tester@example.com';

-- Week 2 check-in
UPDATE "BetaTester" SET
  "week2CheckIn" = NOW(),
  "week2Notes" = 'Active usage, 5 transactions, no issues reported',
  "updatedAt" = NOW()
WHERE email = 'tester@example.com';

-- Week 3 check-in (final)
UPDATE "BetaTester" SET
  "week3CheckIn" = NOW(),
  "week3Notes" = 'Great experience, wants to continue',
  status = 'COMPLETED',
  "willContinue" = true,
  "lifetimeFreeGranted" = true,
  "updatedAt" = NOW()
WHERE email = 'tester@example.com';


-- ============================================================================
-- 5. UPDATE METRICS FROM TRANSACTIONS
-- ============================================================================

-- Calculate metrics for a beta tester from their transactions
UPDATE "BetaTester" bt SET
  "totalTransactions" = (
    SELECT COUNT(*) FROM "Transaction" t 
    JOIN "Merchant" m ON t."merchantId" = m.id 
    WHERE m.email = bt.email AND t.status = 'COMPLETED'
  ),
  "totalVolume" = (
    SELECT COALESCE(SUM("netAmount"), 0) FROM "Transaction" t 
    JOIN "Merchant" m ON t."merchantId" = m.id 
    WHERE m.email = bt.email AND t.status = 'COMPLETED'
  ),
  "updatedAt" = NOW()
WHERE email = 'tester@example.com';


-- ============================================================================
-- 6. COMPLETE BETA & GRANT LIFETIME FREE
-- ============================================================================

-- Update BetaTester record
UPDATE "BetaTester" SET
  status = 'COMPLETED',
  "willContinue" = true,
  "lifetimeFreeGranted" = true,
  "testimonialGiven" = true,
  "testimonialText" = 'NETTEN made accepting crypto super easy for my shop!',
  "updatedAt" = NOW()
WHERE email = 'tester@example.com';

-- Ensure Merchant keeps FREE_BETA tier permanently
UPDATE "Merchant" SET
  tier = 'FREE_BETA',
  "betaNotes" = 'Completed beta program - LIFETIME FREE ACCESS',
  "updatedAt" = NOW()
WHERE email = 'tester@example.com';


-- ============================================================================
-- 7. VIEW BETA PROGRAM STATS
-- ============================================================================

SELECT 
  COUNT(*) as total_testers,
  COUNT(*) FILTER (WHERE status = 'INVITED') as invited,
  COUNT(*) FILTER (WHERE status = 'ONBOARDING') as onboarding,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE status = 'DROPPED') as dropped,
  SUM("totalTransactions") as total_transactions,
  SUM("totalVolume") as total_volume
FROM "BetaTester";


-- ============================================================================
-- 8. FIND MERCHANTS BY TIER
-- ============================================================================

SELECT email, "businessName", tier, "isBetaTester", "betaStartDate"
FROM "Merchant"
WHERE tier = 'FREE_BETA'
ORDER BY "createdAt" DESC;
