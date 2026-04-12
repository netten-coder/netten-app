/**
 * NETTEN Beta Tester Admin Scripts
 * 
 * Usage:
 *   npx ts-node scripts/beta-admin.ts add <email> <businessName> <contactName>
 *   npx ts-node scripts/beta-admin.ts upgrade <email>
 *   npx ts-node scripts/beta-admin.ts list
 *   npx ts-node scripts/beta-admin.ts checkin <email> <week> <notes>
 *   npx ts-node scripts/beta-admin.ts complete <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBetaTester(email: string, businessName: string, contactName: string, businessType?: string) {
  const now = new Date();
  const endDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 3 weeks

  const tester = await prisma.betaTester.create({
    data: {
      email,
      businessName,
      contactName,
      businessType: businessType || 'General',
      status: 'INVITED',
      startDate: now,
      endDate,
    },
  });

  console.log('✅ Beta tester added:');
  console.log(`   Email: ${tester.email}`);
  console.log(`   Business: ${tester.businessName}`);
  console.log(`   Contact: ${tester.contactName}`);
  console.log(`   Start: ${tester.startDate?.toDateString()}`);
  console.log(`   End: ${tester.endDate?.toDateString()}`);
  
  return tester;
}

async function upgradeMerchantToBeta(email: string) {
  const now = new Date();
  const endDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  // Update merchant
  const merchant = await prisma.merchant.update({
    where: { email },
    data: {
      tier: 'FREE_BETA',
      isBetaTester: true,
      betaStartDate: now,
      betaEndDate: endDate,
      betaWeeklyCheckin: 0,
    },
  });

  // Update or create BetaTester record
  await prisma.betaTester.upsert({
    where: { email },
    update: {
      merchantId: merchant.id,
      status: 'ACTIVE',
      startDate: now,
      endDate,
    },
    create: {
      email,
      businessName: merchant.businessName || 'Unknown',
      contactName: email.split('@')[0],
      merchantId: merchant.id,
      status: 'ACTIVE',
      startDate: now,
      endDate,
    },
  });

  console.log('✅ Merchant upgraded to FREE_BETA:');
  console.log(`   Email: ${merchant.email}`);
  console.log(`   Tier: FREE_BETA`);
  console.log(`   Beta Start: ${now.toDateString()}`);
  console.log(`   Beta End: ${endDate.toDateString()}`);
  
  return merchant;
}

async function listBetaTesters() {
  const testers = await prisma.betaTester.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n📋 NETTEN BETA TESTERS\n');
  console.log('─'.repeat(80));
  
  if (testers.length === 0) {
    console.log('No beta testers yet.');
    return;
  }

  for (const t of testers) {
    const statusEmoji = {
      INVITED: '📨',
      ONBOARDING: '🔄',
      ACTIVE: '✅',
      COMPLETED: '🎉',
      DROPPED: '❌',
    }[t.status] || '❓';

    console.log(`${statusEmoji} ${t.businessName} (${t.email})`);
    console.log(`   Status: ${t.status} | Contact: ${t.contactName}`);
    console.log(`   Transactions: ${t.totalTransactions} | Volume: $${t.totalVolume.toFixed(2)}`);
    console.log(`   Check-ins: Week 1 ${t.week1CheckIn ? '✓' : '○'} | Week 2 ${t.week2CheckIn ? '✓' : '○'} | Week 3 ${t.week3CheckIn ? '✓' : '○'}`);
    console.log('─'.repeat(80));
  }

  console.log(`\nTotal: ${testers.length} beta testers`);
  console.log(`Active: ${testers.filter(t => t.status === 'ACTIVE').length}`);
  console.log(`Completed: ${testers.filter(t => t.status === 'COMPLETED').length}`);
}

async function recordCheckin(email: string, week: number, notes: string) {
  const now = new Date();
  const weekField = `week${week}CheckIn` as const;
  const notesField = `week${week}Notes` as const;

  const tester = await prisma.betaTester.update({
    where: { email },
    data: {
      [weekField]: now,
      [notesField]: notes,
      status: week === 3 ? 'COMPLETED' : 'ACTIVE',
    },
  });

  // Also update merchant if linked
  if (tester.merchantId) {
    await prisma.merchant.update({
      where: { id: tester.merchantId },
      data: { betaWeeklyCheckin: week },
    });
  }

  console.log(`✅ Week ${week} check-in recorded for ${email}`);
  console.log(`   Notes: ${notes}`);
}

async function completeBeta(email: string, willContinue: boolean = true, testimonial?: string) {
  const tester = await prisma.betaTester.update({
    where: { email },
    data: {
      status: 'COMPLETED',
      willContinue,
      testimonialGiven: !!testimonial,
      testimonialText: testimonial,
      lifetimeFreeGranted: true,
    },
  });

  // Upgrade merchant to lifetime free tier
  if (tester.merchantId) {
    await prisma.merchant.update({
      where: { id: tester.merchantId },
      data: {
        tier: 'FREE_BETA',  // Lifetime free!
        betaNotes: 'Completed beta program - lifetime free access granted',
      },
    });
  }

  console.log(`🎉 Beta completed for ${email}!`);
  console.log(`   Will continue: ${willContinue ? 'Yes' : 'No'}`);
  console.log(`   Lifetime free: ✅ GRANTED`);
  if (testimonial) {
    console.log(`   Testimonial: "${testimonial}"`);
  }
}

async function updateMetrics(email: string, transactions: number, volume: number, successRate: number) {
  await prisma.betaTester.update({
    where: { email },
    data: {
      totalTransactions: transactions,
      totalVolume: volume,
      successRate,
    },
  });

  console.log(`📊 Metrics updated for ${email}`);
}

// CLI Handler
async function main() {
  const [, , command, ...args] = process.argv;

  try {
    switch (command) {
      case 'add':
        if (args.length < 3) {
          console.log('Usage: beta-admin.ts add <email> <businessName> <contactName> [businessType]');
          process.exit(1);
        }
        await addBetaTester(args[0], args[1], args[2], args[3]);
        break;

      case 'upgrade':
        if (args.length < 1) {
          console.log('Usage: beta-admin.ts upgrade <email>');
          process.exit(1);
        }
        await upgradeMerchantToBeta(args[0]);
        break;

      case 'list':
        await listBetaTesters();
        break;

      case 'checkin':
        if (args.length < 3) {
          console.log('Usage: beta-admin.ts checkin <email> <week> <notes>');
          process.exit(1);
        }
        await recordCheckin(args[0], parseInt(args[1]), args.slice(2).join(' '));
        break;

      case 'complete':
        if (args.length < 1) {
          console.log('Usage: beta-admin.ts complete <email> [testimonial]');
          process.exit(1);
        }
        await completeBeta(args[0], true, args.slice(1).join(' ') || undefined);
        break;

      case 'metrics':
        if (args.length < 4) {
          console.log('Usage: beta-admin.ts metrics <email> <transactions> <volume> <successRate>');
          process.exit(1);
        }
        await updateMetrics(args[0], parseInt(args[1]), parseFloat(args[2]), parseFloat(args[3]));
        break;

      default:
        console.log(`
NETTEN Beta Admin

Commands:
  add <email> <businessName> <contactName> [businessType]  - Add a new beta tester
  upgrade <email>                                           - Upgrade existing merchant to beta
  list                                                      - List all beta testers
  checkin <email> <week> <notes>                           - Record weekly check-in
  complete <email> [testimonial]                           - Complete beta & grant lifetime free
  metrics <email> <transactions> <volume> <successRate>    - Update tester metrics
        `);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
