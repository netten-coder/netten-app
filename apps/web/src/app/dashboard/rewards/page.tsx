'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const LEVELS = [
  { level: 1, rate: 0.25, monthsMin: 0, txnsMin:  0, label: 'Level 1', desc: 'Starter'   },
  { level: 2, rate: 0.50, monthsMin: 3, txnsMin: 30, label: 'Level 2', desc: 'Growing'   },
  { level: 3, rate: 1.00, monthsMin: 6, txnsMin: 60, label: 'Level 3', desc: 'Established' },
  { level: 4, rate: 2.00, monthsMin: 9, txnsMin: 90, label: 'Level 4', desc: 'Elite'      },
]

function monthsSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now  = new Date()
  return Math.max(0, (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()))
}

function getCurrentLevel(monthsTenure: number, lifetimeTxns: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const l = LEVELS[i]
    if (monthsTenure >= l.monthsMin && lifetimeTxns >= l.txnsMin) return l
  }
  return LEVELS[0]
}

export default function RewardsPage() {
  const { merchant } = useAuth()
  const [summary, setSummary] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawMode, setWithdrawMode] = useState<'choose' | 'wallet' | 'bank'>('choose')
  const [withdrawForm, setWithdrawForm] = useState({ toAddress: '', amount: '' })
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    Promise.all([api.rewards.summary(), api.rewards.history()])
      .then(([s, h]: any) => {
        setSummary(s)
        setHistory((h.events || []).filter((ev: any) => ev.type === 'TXN_MILESTONE'))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function withdraw(e: React.FormEvent) {
    e.preventDefault()
    setWithdrawing(true)
    try {
      await api.rewards.withdraw(withdrawForm.toAddress, parseFloat(withdrawForm.amount))
      setShowWithdraw(false)
      const [s, h]: any = await Promise.all([api.rewards.summary(), api.rewards.history()])
      setSummary(s)
      setHistory((h.events || []).filter((ev: any) => ev.type === 'TXN_MILESTONE'))
    } catch (err: any) { alert(err.message) }
    finally { setWithdrawing(false) }
  }

  const balance       = summary?.balance ?? merchant?.rewardBalance ?? 0
  const totalEarned   = summary?.totalEarned ?? merchant?.totalRewardsEarned ?? 0
  const txnsUntilNext = summary?.txnsUntilNext ?? 10
  const txnsDone      = 10 - txnsUntilNext
  const progressPct   = Math.min(100, (txnsDone / 10) * 100)
  const lifetimeTxns  = summary?.lifetimeTxns ?? 0
  const tenure        = merchant?.createdAt ? monthsSince(merchant.createdAt) : 0
  const currentLevel  = getCurrentLevel(tenure, lifetimeTxns)
  const nextLevel     = LEVELS.find(l => l.level === currentLevel.level + 1)

  // Progress toward NEXT level — whichever threshold is further away
  const monthsPct  = nextLevel ? Math.min(100, (tenure / nextLevel.monthsMin) * 100) : 100
  const txnsPct    = nextLevel ? Math.min(100, (lifetimeTxns / nextLevel.txnsMin) * 100) : 100
  const levelPct   = Math.min(monthsPct, txnsPct)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-2xl">Rewards</h1>
        <p className="text-gray-400 text-sm mt-0.5">Earn RLUSD automatically every 10 transactions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="card bg-gradient-to-br from-brand/20 to-surface-card border-brand/30">
              <p className="text-gray-400 text-xs mb-1">Available Balance</p>
              <p className="text-white font-bold text-3xl">{balance.toFixed(4)}</p>
              <p className="text-brand-light text-sm mt-0.5">RLUSD</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Total Earned</p>
              <p className="text-white font-semibold text-2xl">{totalEarned.toFixed(4)}</p>
              <p className="text-gray-500 text-sm">RLUSD lifetime</p>
            </div>
          </div>

          {/* Net Ten progress bar */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">Net Ten Progress</h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  Every 10 transactions earns <span className="text-brand-light font-semibold">${currentLevel.rate.toFixed(2)} RLUSD</span> at your current level
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl">{txnsDone}<span className="text-gray-500 font-normal text-sm"> / 10</span></p>
                <p className="text-gray-500 text-xs">{txnsUntilNext} to go</p>
              </div>
            </div>
            <div className="w-full bg-surface-border rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {txnsDone === 0 && (
              <p className="text-gray-500 text-xs mt-2">Process your first payment to start the counter</p>
            )}
          </div>

          {/* Level tiers */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Net Ten Reward Levels</h3>
              <span className="text-brand text-xs font-semibold bg-brand/10 px-2.5 py-1 rounded-lg">
                {currentLevel.label} Active — ${currentLevel.rate.toFixed(2)}/milestone
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {LEVELS.map((lvl) => {
                const isAchieved = lvl.level < currentLevel.level
                const isCurrent  = lvl.level === currentLevel.level
                const isLocked   = lvl.level > currentLevel.level

                return (
                  <div
                    key={lvl.level}
                    className={`rounded-xl p-3 border transition-all ${
                      isCurrent  ? 'border-brand/50 bg-brand/10'
                      : isAchieved ? 'border-surface-border bg-surface-card opacity-50'
                      : 'border-surface-border bg-surface-card opacity-35'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-widest ${isCurrent ? 'text-brand' : 'text-gray-500'}`}>
                        {lvl.label}
                      </span>
                      {isCurrent  && <span className="text-brand text-xs font-medium bg-brand/20 px-1.5 py-0.5 rounded-md">Active</span>}
                      {isAchieved && <span className="text-gray-500 text-xs">✓</span>}
                      {isLocked   && <span className="text-gray-600 text-xs">🔒</span>}
                    </div>
                    <p className={`font-bold text-xl ${isCurrent ? 'text-white' : isAchieved ? 'text-gray-500 line-through decoration-gray-600' : 'text-gray-600'}`}>
                      ${lvl.rate.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">per milestone</p>
                    {isLocked && (
                      <p className="text-gray-600 text-xs mt-1.5 leading-tight">{lvl.monthsMin}mo + {lvl.txnsMin} txns</p>
                    )}
                    {isCurrent && (
                      <p className="text-brand/70 text-xs mt-1.5">{lvl.desc}</p>
                    )}
                    {isAchieved && (
                      <p className="text-gray-600 text-xs mt-1.5">Achieved</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress toward next level */}
            {nextLevel && (
              <div className="border-t border-surface-border pt-4">
                <p className="text-gray-400 text-xs mb-3">Progress toward {nextLevel.label} (${nextLevel.rate.toFixed(2)}/milestone)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Tenure</span>
                      <span className="text-gray-400">{tenure} / {nextLevel.monthsMin} months</span>
                    </div>
                    <div className="w-full bg-surface-border rounded-full h-1.5">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${monthsPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Transactions</span>
                      <span className="text-gray-400">{lifetimeTxns} / {nextLevel.txnsMin}</span>
                    </div>
                    <div className="w-full bg-surface-border rounded-full h-1.5">
                      <div className="h-full bg-purple-500 rounded-full transition-all duration-700" style={{ width: `${txnsPct}%` }} />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-3">Both thresholds must be met to advance. You will receive an email when you unlock the next level.</p>
              </div>
            )}

            {!nextLevel && (
              <div className="border-t border-surface-border pt-4">
                <p className="text-brand-light text-sm font-medium">🏆 You have reached the highest reward level!</p>
                <p className="text-gray-500 text-xs mt-1">Every milestone earns you $2.00 RLUSD — the maximum rate.</p>
              </div>
            )}
          </div>

          {/* Withdraw */}
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowWithdraw(true)} disabled={balance <= 0} className="btn-primary text-sm disabled:opacity-40">
              Withdraw RLUSD
            </button>
          </div>

          {/* Withdraw modal */}
          {showWithdraw && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="card w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">Withdraw Rewards</h2>
                  <button onClick={() => { setShowWithdraw(false); setWithdrawMode('choose') }} className="text-gray-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                {withdrawMode === 'choose' && (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm mb-4">How would you like to receive your RLUSD?</p>
                    <button onClick={() => setWithdrawMode('wallet')} className="w-full flex items-center gap-4 p-4 rounded-xl border border-surface-border hover:border-brand/50 hover:bg-brand/5 transition-all text-left">
                      <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">To XRPL Wallet</p>
                        <p className="text-gray-500 text-xs mt-0.5">Instant · Free · Stays in RLUSD</p>
                      </div>
                      <span className="text-brand text-xs font-medium bg-brand/10 px-2 py-1 rounded-lg">Free</span>
                    </button>
                    <button onClick={() => setWithdrawMode('bank')} className="w-full flex items-center gap-4 p-4 rounded-xl border border-surface-border hover:border-brand/50 hover:bg-brand/5 transition-all text-left">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">To Bank Account / Card</p>
                        <p className="text-gray-500 text-xs mt-0.5">Visa · Mastercard · Apple Pay · 160+ countries</p>
                      </div>
                      <span className="text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-1 rounded-lg">~1%</span>
                    </button>
                  </div>
                )}

                {withdrawMode === 'wallet' && (
                  <form onSubmit={withdraw} className="space-y-3">
                    <button type="button" onClick={() => setWithdrawMode('choose')} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs mb-2">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>Back
                    </button>
                    <div><label className="label">XRPL destination address</label><input className="input" placeholder="r..." value={withdrawForm.toAddress} onChange={e => setWithdrawForm(f => ({ ...f, toAddress: e.target.value }))} required /></div>
                    <div><label className="label">Amount (RLUSD)</label><input type="number" step="0.0001" min="0.01" className="input" value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} required /></div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setWithdrawMode('choose')} className="btn-secondary flex-1">Back</button>
                      <button type="submit" disabled={withdrawing} className="btn-primary flex-1">{withdrawing ? 'Sending…' : 'Withdraw'}</button>
                    </div>
                  </form>
                )}

                {withdrawMode === 'bank' && (
                  <div className="space-y-3">
                    <button type="button" onClick={() => setWithdrawMode('choose')} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs mb-2">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>Back
                    </button>
                    <div>
                      <label className="label">Amount to cash out (RLUSD)</label>
                      <input type="number" step="0.0001" min="0.01" className="input" placeholder="0.25" value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} />
                      <p className="text-gray-500 text-xs mt-1">~1% bank transfer fee charged by MoonPay</p>
                    </div>
                    <div className="bg-surface-card rounded-xl p-3 text-xs text-gray-400 space-y-1">
                      <p>✓ Powered by MoonPay — licensed global off-ramp</p>
                      <p>✓ 160+ countries · Visa · Mastercard · Bank transfer</p>
                      <p>✓ KYC handled by MoonPay — not by NETTEN</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setWithdrawMode('choose')} className="btn-secondary flex-1">Back</button>
                      <button
                        onClick={async () => {
                          if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) { alert('Enter an amount'); return }
                          setWithdrawing(true)
                          try {
                            const token = localStorage.getItem('netten_token')
                            const res = await fetch('/api/v1/rewards/offramp-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ amount: parseFloat(withdrawForm.amount) })
                            })
                            const data = await res.json()
                            if (data.url) window.open(data.url, '_blank', 'width=480,height=700')
                            else alert(data.error || 'Failed to open off-ramp')
                          } catch { alert('Failed to connect to MoonPay') }
                          finally { setWithdrawing(false) }
                        }}
                        disabled={withdrawing}
                        className="btn-primary flex-1"
                      >
                        {withdrawing ? 'Opening…' : 'Cash Out to Bank →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Net Ten reward history */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
              <h3 className="text-white font-medium">Net Ten Reward History</h3>
              <span className="text-gray-500 text-xs">Transactions that triggered a reward</span>
            </div>
            {!history.length ? (
              <div className="py-10 text-center">
                <p className="text-gray-500 text-sm">No rewards yet</p>
                <p className="text-gray-600 text-xs mt-1">Process 10 transactions to earn your first ${currentLevel.rate.toFixed(2)} RLUSD</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border/50">
                {history.map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-brand text-xs">⚡</span>
                        <p className="text-white text-sm">Net Ten milestone reached</p>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="font-semibold text-sm text-brand-light">+{ev.amountRlusd.toFixed(4)} RLUSD</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
