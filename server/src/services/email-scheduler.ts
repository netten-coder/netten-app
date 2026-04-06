// server/src/services/email-scheduler.ts
import { db } from '../lib/db';
import { nanoid } from 'nanoid';
import { sendFoundingMemberEmail, emailSequence } from '../emails/founding-member-sequence';

const TOTAL_SPOTS = 777;

export async function registerFoundingMember(
  email: string,
  firstName: string,
  referredByCode?: string
): Promise<{ success: boolean; spotNumber?: number; referralCode?: string; error?: string }> {
  try {
    const existing = await db.foundingMember.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: 'Email already registered', spotNumber: existing.spotNumber, referralCode: existing.referralCode };
    }

    const counter = await db.globalCounter.upsert({
      where: { id: 'founding_spots' },
      create: { id: 'founding_spots', value: 1 },
      update: { value: { increment: 1 } },
    });

    const spotNumber = counter.value;
    if (spotNumber > TOTAL_SPOTS) {
      return { success: false, error: 'All founding spots are taken' };
    }

    const referralCode = `NETTEN-${nanoid(6).toUpperCase()}`;

    const member = await db.foundingMember.create({
      data: {
        email,
        firstName,
        spotNumber,
        referralCode,
        referredBy: referredByCode || null,
        emailSequenceStep: 0,
        nextEmailDue: new Date(),
        isActive: true,
      },
    });

    const emailResult = await sendFoundingMemberEmail(email, firstName, spotNumber, referralCode, 'welcome');

    if (emailResult.success) {
      await db.emailLog.create({
        data: { foundingMemberId: member.id, emailType: 'welcome', resendId: emailResult.resendId, status: 'sent' },
      });
      const nextEmailDate = new Date();
      nextEmailDate.setDate(nextEmailDate.getDate() + 2);
      await db.foundingMember.update({
        where: { id: member.id },
        data: { emailSequenceStep: 1, nextEmailDue: nextEmailDate },
      });
    }

    if (referredByCode) {
      const referrer = await db.foundingMember.findUnique({ where: { referralCode: referredByCode } });
      if (referrer) console.log(`[referral] ${email} referred by ${referrer.email}`);
    }

    return { success: true, spotNumber, referralCode };
  } catch (error) {
    console.error('[registerFoundingMember] Error:', error);
    return { success: false, error: String(error) };
  }
}

export async function getSpotsRemaining(): Promise<number> {
  const counter = await db.globalCounter.findUnique({ where: { id: 'founding_spots' } });
  return TOTAL_SPOTS - (counter?.value || 0);
}

export async function processEmailQueue(): Promise<{ processed: number; errors: number }> {
  let processed = 0, errors = 0;
  try {
    const dueMembers = await db.foundingMember.findMany({
      where: { isActive: true, emailSequenceStep: { lt: emailSequence.length }, nextEmailDue: { lte: new Date() } },
      take: 50,
    });
    const spotsRemaining = await getSpotsRemaining();

    for (const member of dueMembers) {
      const step = emailSequence[member.emailSequenceStep];
      if (!step) continue;

      const result = await sendFoundingMemberEmail(member.email, member.firstName, member.spotNumber, member.referralCode, step.template, spotsRemaining);

      if (result.success) {
        await db.emailLog.create({
          data: { foundingMemberId: member.id, emailType: step.template, resendId: result.resendId, status: 'sent' },
        });
        const nextStep = emailSequence[member.emailSequenceStep + 1];
        let nextEmailDue: Date | null = null;
        if (nextStep) {
          nextEmailDue = new Date();
          nextEmailDue.setDate(nextEmailDue.getDate() + (nextStep.dayOffset - step.dayOffset));
        }
        await db.foundingMember.update({
          where: { id: member.id },
          data: { emailSequenceStep: member.emailSequenceStep + 1, nextEmailDue },
        });
        processed++;
      } else {
        errors++;
      }
    }
  } catch (error) {
    console.error('[processEmailQueue] Error:', error);
    errors++;
  }
  return { processed, errors };
}

export async function handleEmailOpen(resendId: string): Promise<boolean> {
  try {
    const log = await db.emailLog.findFirst({ where: { resendId } });
    if (log) { await db.emailLog.update({ where: { id: log.id }, data: { openedAt: new Date() } }); return true; }
    return false;
  } catch { return false; }
}

export async function handleEmailClick(resendId: string): Promise<boolean> {
  try {
    const log = await db.emailLog.findFirst({ where: { resendId } });
    if (log) { await db.emailLog.update({ where: { id: log.id }, data: { clickedAt: new Date() } }); return true; }
    return false;
  } catch { return false; }
}

export async function handleEmailBounce(resendId: string): Promise<boolean> {
  try {
    const log = await db.emailLog.findFirst({ where: { resendId } });
    if (log) {
      await db.emailLog.update({ where: { id: log.id }, data: { status: 'bounced' } });
      await db.foundingMember.update({ where: { id: log.foundingMemberId }, data: { isActive: false } });
      return true;
    }
    return false;
  } catch { return false; }
}
