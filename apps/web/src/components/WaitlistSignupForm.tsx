'use client'
import { useState } from 'react'

export function WaitlistSignupForm({ referralCode: initialCode = '' }: { referralCode?: string }) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [referralCode, setReferralCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{spotNumber:number,referralCode:string}|null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('https://netten-app-production.up.railway.app/api/email/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, referredBy: referralCode || undefined })
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Something went wrong'); return }
      setSuccess(data)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  if (success) return (
    <div className="text-center p-6 bg-zinc-900/50 rounded-2xl border border-teal-500/30">
      <div className="text-4xl mb-4">🎉</div>
      <h3 className="text-xl font-bold text-white mb-2">You're Founding Member #{success.spotNumber}!</h3>
      <p className="text-zinc-400 mb-4">Check your email for next steps.</p>
      <div className="bg-zinc-800 rounded-lg p-4">
        <p className="text-zinc-500 text-xs mb-1">Your referral code</p>
        <p className="text-teal-400 font-mono text-lg">{success.referralCode}</p>
        <p className="text-zinc-500 text-xs mt-2">Share to earn $10 RLUSD per conversion</p>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="First Name" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-teal-500" />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-teal-500" />
      <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Referral Code (optional)" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-teal-500" />
      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      <button type="submit" disabled={loading} className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-700 text-black font-semibold rounded-lg">
        {loading ? 'Joining...' : 'Claim Your Founding Spot'}
      </button>
      <p className="text-center text-zinc-500 text-xs">$44/mo forever. Cancel anytime.</p>
    </form>
  )
}
