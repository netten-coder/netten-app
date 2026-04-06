// ============================================
// EMAIL SCHEDULER SERVICE
// Handles automated email sequence timing
// ============================================

import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { foundingMemberSequence } from '../emails/founding-member-sequence';

const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

// Email schedule in days
const EMAIL_SCHEDULE = [
  { day: 0, emailIndex: 0 },  // Welcome - immediate
  { day: 2, emailIndex: 1 },  // Problem
  { day: 5, emailIndex: 2 },  // Benefits
  { day: 10, emailIndex: 3 }, // Case study
  { day: 14, emailIndex: 4 }, // Urgency
  { day: 30, emailIndex: 5 }, // Re-engagement (only if inactive)
];

// ============================================
// SEND WELCOME EMAIL (Day 0)
// Call this immediately when someone signs up
// ============================================

export async function sendWelcomeEmail(foundingMember: {
  id: string;
  email: string;
  firstName?: string;
  spotNumber: number;
  referralCode: string;
}) {
  const email = foundingMemberSequence[0]; // email1_welcome
  
  // Get current spots remaining
  const totalMembers = await prisma.foundingMember.count({ where: { isActive: true } });
  const spotsRemaining = 777 - totalMembers;
  
  // Replace placeholders
  const html = email.html
    .replace(/\{\{FIRST_NAME\}\}/g, foundingMember.firstName || 'there')
    .replace(/\{\{SPOT_NUMBER\}\}/g, foundingMember.spotNumber.toString())
    .replace(/\{\{REFERRAL_LINK\}\}/g, `https://netten.app?ref=${foundingMember.referralCode}`)
    .replace(/\{\{SPOTS_REMAINING\}\}/g, spotsRemaining.toString());
  
  const subject = email.subject
    .replace(/\{\{SPOT_NUMBER\}\}/g, foundingMember.spotNumber.toString());
  
  try {
    const result = await resend.emails.send({
      from: 'Netten <hello@netten.app>',
      to: foundingMember.email,
      subject,
      html,
    });
    
    // Log the email
    await prisma.emailLog.create({
      data: {
        foundingMemberId: foundingMember.id,
        emailType: 'email1_welcome',
        subject,
        resendId: result.data?.id,
      }
    });
    
    // Update member's sequence status
    await prisma.foundingMember.update({
      where: { id: foundingMember.id },
      data: {
        emailSequenceStep: 1,
        lastEmailSentAt: new Date(),
        nextEmailDue: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      }
    });
    
    return { success: true, resendId: result.data?.id };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

// ============================================
// PROCESS EMAIL QUEUE
// Run this via cron job every hour
// ============================================

export async function processEmailQueue() {
  const now = new Date();
  
  // Find all members who are due for their next email
  const membersDue = await prisma.foundingMember.findMany({
    where: {
      isActive: true,
      nextEmailDue: { lte: now },
      emailSequenceStep: { lt: 5 }, // Haven't completed sequence
    }
  });
  
  console.log(`Processing ${membersDue.length} members due for emails`);
  
  for (const member of membersDue) {
    await sendNextSequenceEmail(member);
  }
  
  // Handle re-engagement emails (day 30, only for inactive)
  const inactiveMembers = await prisma.foundingMember.findMany({
    where: {
      isActive: true,
      emailSequenceStep: 5, // Completed main sequence
      emailsOpened: 0, // Never opened an email
      lastEmailSentAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30+ days ago
    }
  });
  
  for (const member of inactiveMembers) {
    await sendReengagementEmail(member);
  }
  
  return { processed: membersDue.length, reengagement: inactiveMembers.length };
}

// ============================================
// SEND NEXT SEQUENCE EMAIL
// ============================================

async function sendNextSequenceEmail(member: any) {
  const emailIndex = member.emailSequenceStep;
  
  if (emailIndex >= foundingMemberSequence.length - 1) {
    // Skip re-engagement email in normal sequence
    return;
  }
  
  const email = foundingMemberSequence[emailIndex];
  const nextSchedule = EMAIL_SCHEDULE[emailIndex + 1];
  
  // Get current spots remaining
  const totalMembers = await prisma.foundingMember.count({ where: { isActive: true } });
  const spotsRemaining = 777 - totalMembers;
  
  // Replace placeholders
  const html = email.html
    .replace(/\{\{FIRST_NAME\}\}/g, member.firstName || 'there')
    .replace(/\{\{SPOT_NUMBER\}\}/g, member.spotNumber.toString())
    .replace(/\{\{REFERRAL_LINK\}\}/g, `https://netten.app?ref=${member.referralCode}`)
    .replace(/\{\{SPOTS_REMAINING\}\}/g, spotsRemaining.toString());
  
  const subject = email.subject
    .replace(/\{\{SPOT_NUMBER\}\}/g, member.spotNumber.toString())
    .replace(/\{\{SPOTS_REMAINING\}\}/g, spotsRemaining.toString());
  
  try {
    const result = await resend.emails.send({
      from: 'Netten <hello@netten.app>',
      to: member.email,
      subject,
      html,
    });
    
    // Log the email
    await prisma.emailLog.create({
      data: {
        foundingMemberId: member.id,
        emailType: `email${emailIndex + 1}_${email.subject.split(' ')[0].toLowerCase()}`,
        subject,
        resendId: result.data?.id,
      }
    });
    
    // Calculate next email due date
    const daysUntilNext = nextSchedule 
      ? nextSchedule.day - EMAIL_SCHEDULE[emailIndex].day
      : null;
    
    // Update member's sequence status
    await prisma.foundingMember.update({
      where: { id: member.id },
      data: {
        emailSequenceStep: emailIndex + 1,
        lastEmailSentAt: new Date(),
        nextEmailDue: daysUntilNext 
          ? new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000)
          : null,
      }
    });
    
    console.log(`Sent email ${emailIndex + 1} to ${member.email}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send email to ${member.email}:`, error);
    return { success: false, error };
  }
}

// ============================================
// SEND RE-ENGAGEMENT EMAIL
// ============================================

async function sendReengagementEmail(member: any) {
  const email = foundingMemberSequence[5]; // email6_reengagement
  
  const totalMembers = await prisma.foundingMember.count({ where: { isActive: true } });
  const spotsRemaining = 777 - totalMembers;
  
  const html = email.html
    .replace(/\{\{FIRST_NAME\}\}/g, member.firstName || 'there')
    .replace(/\{\{SPOTS_REMAINING\}\}/g, spotsRemaining.toString());
  
  try {
    const result = await resend.emails.send({
      from: 'Netten <hello@netten.app>',
      to: member.email,
      subject: email.subject,
      html,
    });
    
    await prisma.emailLog.create({
      data: {
        foundingMemberId: member.id,
        emailType: 'email6_reengagement',
        subject: email.subject,
        resendId: result.data?.id,
      }
    });
    
    // Mark as sent (don't send again)
    await prisma.foundingMember.update({
      where: { id: member.id },
      data: {
        emailSequenceStep: 6,
        lastEmailSentAt: new Date(),
      }
    });
    
    console.log(`Sent re-engagement email to ${member.email}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send re-engagement email to ${member.email}:`, error);
    return { success: false, error };
  }
}

// ============================================
// TRACK EMAIL OPENS (Webhook handler)
// ============================================

export async function handleEmailOpen(resendId: string) {
  const emailLog = await prisma.emailLog.findFirst({
    where: { resendId },
    include: { foundingMember: true }
  });
  
  if (!emailLog) return;
  
  await prisma.emailLog.update({
    where: { id: emailLog.id },
    data: { 
      openedAt: new Date(),
      status: 'opened'
    }
  });
  
  await prisma.foundingMember.update({
    where: { id: emailLog.foundingMemberId },
    data: {
      emailsOpened: { increment: 1 },
      lastOpenedAt: new Date()
    }
  });
}

// ============================================
// GET SPOTS REMAINING (for live counter)
// ============================================

export async function getSpotsRemaining(): Promise<number> {
  const totalMembers = await prisma.foundingMember.count({ 
    where: { isActive: true } 
  });
  return 777 - totalMembers;
}

// ============================================
// REGISTER NEW FOUNDING MEMBER
// ============================================

export async function registerFoundingMember(data: {
  email: string;
  firstName?: string;
  referralCode?: string; // If they came from a referral
}) {
  // Get next spot number
  const lastMember = await prisma.foundingMember.findFirst({
    orderBy: { spotNumber: 'desc' }
  });
  const spotNumber = (lastMember?.spotNumber || 0) + 1;
  
  if (spotNumber > 777) {
    throw new Error('All founding spots are filled!');
  }
  
  // Create the member
  const member = await prisma.foundingMember.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      spotNumber,
      referredBy: data.referralCode,
    }
  });
  
  // Send welcome email immediately
  await sendWelcomeEmail(member);
  
  // If referred, notify the referrer
  if (data.referralCode) {
    const referrer = await prisma.foundingMember.findUnique({
      where: { referralCode: data.referralCode }
    });
    if (referrer) {
      // Send referral notification email to referrer
      // (use the existing referral email templates)
    }
  }
  
  return member;
}
