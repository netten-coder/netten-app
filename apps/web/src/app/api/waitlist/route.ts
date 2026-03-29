import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://netten-app-production.up.railway.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${API_URL}/api/v1/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/waitlist/count`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
