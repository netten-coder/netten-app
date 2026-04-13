'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TIER_COLORS: Record<string, string> = {
  starter:    'text-gray-400',
  ambassador: 'text-blue-400',
  elite:      'text-brand-light',
}

const TIER_BADGES: Record<string, string> = {
  starter:    'bg-surface-card text-gray-400 border-surface-border',
  ambassador: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  elite:      'bg-brand/10 text-brand-light border-brand/30',
}

export default function ReferralsPage() {
  const { merchant } = useAuth()
  const [stats, setStats]         = useState<any>(null)
  const [leaderboard, setLboard]  = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('netten_token')
    if (!token) return

    Promise.all([
      fetch(`${API_URL}/api/v1/referrals/stats`,       { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/v1/referrals/leaderboard`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([s, l]) => {
      setStats(s)
      setLboard(l.leaderboard || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  function copyLink() {
    if (!stats?.referralUrl) return
    navigator.clipboard.writeText(stats.referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tier       = stats?.tier
  const count      = stats?.totalReferrals ?? 0
  const nextAt     = tier?.nextTierAt
  const progress   = nextAt ? Math.min((count / nextAt) * 100, 100) : 100
  const basePrice  = merchant?.plan === 'FOUNDING' ? 44 : 55
  const netPrice   = Math.max(0, basePrice - (tier?.monthlyCredit ?? 0))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-2xl">Ambassador Program</h1>
        <p className="text-gray-400 text-sm mt-0.5">Refer merchants. Earn subscription credits. Grow together.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Total referrals</p>
              <p className="text-white font-bold text-3xl">{count}</p>
              <p className="text-gray-500 text-xs mt-0.5">active members</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Current tier</p>
              <p className={`font-semibold text-xl ${TIER_COLORS[tier?.tier ?? 'starter']}`}>{tier?.label ?? 'Starter'}</p>
              <p className="text-gray-500 text-xs mt-0.5">ambassador level</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Monthly credit</p>
              <p className="text-white font-bold text-3xl">${tier?.monthlyCredit ?? 0}</p>
              <p className="text-gray-500 text-xs mt-0.5">off your subscription</p>
            </div>
            <div className={`card ${netPrice === 0 ? 'bg-gradient-to-br from-brand/20 to-surface-card border-brand/30' : ''}`}>
              <p className="text-gray-400 text-xs mb-1">You pay</p>
              <p className={`font-bold text-3xl ${netPrice === 0 ? 'text-brand-light' : 'text-white'}`}>
                {netPrice === 0 ? 'FREE' : `$${netPrice}/mo`}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">{netPrice === 0 ? 'subscription covered' : `vs $${basePrice} base`}</p>
            </div>
          </div>

          {/* Referral link */}
          <div className="card mb-6">
            <h3 className="text-white font-medium mb-3">Your referral link</h3>
            {stats?.referralUrl ? (
              <>
                <div className="bg-surface-card rounded-xl px-4 py-3 font-mono text-sm text-brand-light break-all mb-3">
                  {stats.referralUrl}
                </div>
                <button onClick={copyLink} className={`btn-primary text-sm w-full ${copied ? 'opacity-80' : ''}`}>
                  {copied ? '✓ Copied!' : 'Copy referral link'}
                </button>
                <p className="text-gray-600 text-xs text-center mt-2">Share this link — when they join Netten, you earn credits</p>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Sign up on the waitlist at netten.app to get your referral link.</p>
            )}
          </div>

          {/* Progress to next tier */}
          {nextAt && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">Progress to next tier</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{tier?.nextTierLabel}</p>
                </div>
                <span className="text-gray-400 text-sm">{count} / {nextAt}</span>
              </div>
              <div className="w-full bg-surface-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-600 text-xs mt-2">{nextAt - count} more referral{nextAt - count !== 1 ? 's' : ''} to unlock {tier?.nextTierLabel}</p>
            </div>
          )}

          {/* Tier breakdown */}
          <div className="card mb-6">
            <h3 className="text-white font-medium mb-4">Ambassador tiers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { tier: 'starter',    label: 'Starter',           req: '1–4 referrals',  benefit: '1 free month per referral',    price: '$44–55/mo' },
                { tier: 'ambassador', label: 'Ambassador',         req: '5–9 referrals',  benefit: '$11/mo ongoing credit',        price: '$33–44/mo' },
                { tier: 'elite',      label: 'Elite Ambassador',   req: '10+ referrals',  benefit: '$55/mo credit — free sub',     price: 'FREE' },
              ].map(t => {
                const isActive = tier?.tier === t.tier
                return (
                  <div key={t.tier} className={`rounded-xl p-4 border transition-all ${isActive ? 'border-brand/50 bg-brand/10' : 'border-surface-border bg-surface-card opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-brand' : 'text-gray-500'}`}>{t.label}</span>
                      {isActive && <span className="text-brand text-xs font-medium bg-brand/20 px-1.5 py-0.5 rounded-md">Active</span>}
                    </div>
                    <p className="text-gray-400 text-xs mb-1">{t.req}</p>
                    <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>{t.benefit}</p>
                    <p className={`text-xs mt-1 ${isActive ? 'text-brand-light' : 'text-gray-600'}`}>{t.price}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Your referrals list */}
          {stats?.referrals?.length > 0 && (
            <div className="card p-0 overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-surface-border">
                <h3 className="text-white font-medium">Your referrals</h3>
              </div>
              <div className="divide-y divide-surface-border/50">
                {stats.referrals.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors">
                    <div>
                      <p className="text-white text-sm">{r.email}</p>
                      <p className="text-gray-500 text-xs">{new Date(r.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <span className="text-brand text-xs font-medium bg-brand/10 px-2 py-1 rounded-lg">+1 referral</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
                <h3 className="text-white font-medium">Top ambassadors</h3>
                <span className="text-gray-500 text-xs">Community leaderboard</span>
              </div>
              <div className="divide-y divide-surface-border/50">
                {leaderboard.map((entry: any) => {
                  const isMe = entry.code === stats?.referralCode
                  return (
                    <div key={entry.rank} className={`flex items-center justify-between px-5 py-3 ${isMe ? 'bg-brand/5' : 'hover:bg-surface-hover'} transition-colors`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${entry.rank <= 3 ? 'bg-brand/20 text-brand-light' : 'bg-surface-card text-gray-500'}`}>
                          {entry.rank}
                        </span>
                        <div>
                          <p className="text-white text-sm">{isMe ? 'You' : `Ambassador ${entry.code.slice(-4)}`}</p>
                          <p className="text-gray-500 text-xs">{entry.tier}</p>
                        </div>
                      </div>
                      <span className="text-white text-sm font-medium">{entry.count} referral{entry.count !== 1 ? 's' : ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
