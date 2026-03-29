import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, referralCode } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if already signed up
    const existing = await prisma.waitlist.findUnique({
      where: { email: normalizedEmail }
    })

    if (existing) {
      const count = await prisma.waitlist.count()
      return NextResponse.json({
        success: true,
        referralCode: existing.referralCode,
        count,
        message: 'Already on the list!'
      })
    }

    // Generate unique referral code
    const myReferralCode = 'NET' + nanoid(6).toUpperCase()

    // Find referrer if code provided
    let referredBy = null
    if (referralCode) {
      const referrer = await prisma.waitlist.findUnique({
        where: { referralCode }
      })
      if (referrer) {
        referredBy = referrer.id
        // Increment referrer's count
        await prisma.waitlist.update({
          where: { id: referrer.id },
          data: { referralCount: { increment: 1 } }
        })
      }
    }

    // Create waitlist entry
    await prisma.waitlist.create({
      data: {
        email: normalizedEmail,
        referralCode: myReferralCode,
        referredById: referredBy,
      }
    })

    const count = await prisma.waitlist.count()

    return NextResponse.json({
      success: true,
      referralCode: myReferralCode,
      count,
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const count = await prisma.waitlist.count()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
