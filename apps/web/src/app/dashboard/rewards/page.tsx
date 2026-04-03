'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

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
        setHistory(h.events || [])
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
      // Reload
      const [s, h]: any = await Promise.all([api.rewards.summary(), api.rewards.history()])
      setSummary(s)
      setHistory(h.events || [])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setWithdrawing(false)
    }
  }

  const TYPE_LABELS: Record<string, string> = {
    TXN_MILESTONE: 'Transaction milestone',
    VOLUME_BONUS:  'Volume bonus',
    WITHDRAWAL:    'Withdrawal',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-2xl">Rewards</h1>
        <p className="text-gray-400 text-sm mt-0.5">Earn RLUSD automatically as you process payments</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card bg-gradient-to-br from-brand/20 to-surface-card border-brand/30">
              <p className="text-gray-400 text-xs mb-1">Available Balance</p>
              <p className="text-white font-bold text-3xl">{(summary?.balance || merchant?.rewardBalance || 0).toFixed(4)}</p>
              <p className="text-brand-light text-sm mt-0.5">RLUSD</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Total Earned</p>
              <p className="text-white font-semibold text-2xl">{(summary?.totalEarned || merchant?.totalRewardsEarned || 0).toFixed(4)}</p>
              <p className="text-gray-500 text-sm">RLUSD lifetime</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Next Milestone</p>
              <p className="text-white font-semibold text-2xl">{summary?.txnsUntilNext ?? '—'}</p>
              <p className="text-gray-500 text-sm">transactions away</p>
            </div>
          </div>

          {/* How it works */}
          <div className="card mb-6">
            <h3 className="text-white font-medium mb-3">How Netten Rewards work</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-brand-light font-medium">Every 50 txns</p>
                <p className="text-gray-400">+5 RLUSD deposited to your wallet</p>
              </div>
              <div>
                <p className="text-brand-light font-medium">Every 200 txns</p>
                <p className="text-gray-400">+25 RLUSD bonus</p>
              </div>
              <div>
                <p className="text-brand-light font-medium">Every 500 txns</p>
                <p className="text-gray-400">+75 RLUSD mega bonus</p>
              </div>
            </div>
          </div>

          {/* Withdraw */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={!(summary?.balance > 0 || ( merchant?.rewardBalance ?? 0) > 0)}
              className="btn-primary text-sm disabled:opacity-40"
            >
              Withdraw RLUSD
            </button>
          </div>

          {showWithdraw && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="card w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">Withdraw Rewards</h2>
                  <button onClick={() => { setShowWithdraw(false); setWithdrawMode('choose') }} className="text-gray-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* Step 1 — Choose withdrawal method */}
                {withdrawMode === 'choose' && (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm mb-4">How would you like to receive your RLUSD?</p>

                    {/* XRPL Wallet option */}
                    <button
                      onClick={() => setWithdrawMode('wallet')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-surface-border hover:border-brand/50 hover:bg-brand/5 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">To XRPL Wallet</p>
                        <p className="text-gray-500 text-xs mt-0.5">Instant · Free · Stays in RLUSD</p>
                      </div>
                      <span className="text-brand text-xs font-medium bg-brand/10 px-2 py-1 rounded-lg">Free</span>
                    </button>

                    {/* Bank / Card option via Alchemy Pay */}
                    <button
                      onClick={() => setWithdrawMode('bank')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-surface-border hover:border-brand/50 hover:bg-brand/5 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">To Bank Account / Card</p>
                        <p className="text-gray-500 text-xs mt-0.5">Visa · Mastercard · Apple Pay · Bank Transfer · 173 countries</p>
                      </div>
                      <span className="text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-1 rounded-lg">~1.5%</span>
                    </button>
                  </div>
                )}

                {/* Step 2a — XRPL Wallet withdrawal */}
                {withdrawMode === 'wallet' && (
                  <form onSubmit={withdraw} className="space-y-3">
                    <button type="button" onClick={() => setWithdrawMode('choose')} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs mb-2 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                      Back
                    </button>
                    <div>
                      <label className="label">XRPL destination address</label>
                      <input className="input" placeholder="r..." value={withdrawForm.toAddress} onChange={e => setWithdrawForm(f => ({ ...f, toAddress: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="label">Amount (RLUSD)</label>
                      <input type="number" step="0.0001" min="0.01" className="input" value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} required />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setWithdrawMode('choose')} className="btn-secondary flex-1">Back</button>
                      <button type="submit" disabled={withdrawing} className="btn-primary flex-1">{withdrawing ? 'Sending…' : 'Withdraw'}</button>
                    </div>
                  </form>
                )}

                {/* Step 2b — Bank / Card via Alchemy Pay off-ramp */}
                {withdrawMode === 'bank' && (
                  <div className="space-y-3">
                    <button type="button" onClick={() => setWithdrawMode('choose')} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs mb-2 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                      Back
                    </button>
                    <div>
                      <label className="label">Amount to cash out (RLUSD)</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.01"
                        className="input"
                        placeholder="0.25"
                        value={withdrawForm.amount}
                        onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                      />
                      <p className="text-gray-500 text-xs mt-1">~1.5% off-ramp fee charged by Alchemy Pay</p>
                    </div>
                    <div className="bg-surface-card rounded-xl p-3 text-xs text-gray-400 space-y-1">
                      <p>✓ Powered by Alchemy Pay — official Ripple RLUSD partner</p>
                      <p>✓ 173 countries · Visa · Mastercard · Apple Pay · Bank transfer</p>
                      <p>✓ KYC handled by Alchemy Pay — not by Netten</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setWithdrawMode('choose')} className="btn-secondary flex-1">Back</button>
                      <button
                        onClick={async () => {
                          if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) { alert('Enter an amount'); return }
                          setWithdrawing(true)
                          try {
                            const res = await fetch('/api/rewards/offramp-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ amount: parseFloat(withdrawForm.amount) })
                            })
                            const data = await res.json()
                            if (data.url) window.open(data.url, '_blank', 'width=480,height=700')
                            else alert(data.error || 'Failed to open off-ramp')
                          } catch { alert('Failed to connect to Alchemy Pay') }
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

          {/* History */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-border">
              <h3 className="text-white font-medium">Reward history</h3>
            </div>
            {!history.length ? (
              <div className="py-10 text-center text-gray-500 text-sm">No rewards yet — start processing payments!</div>
            ) : (
              <div className="divide-y divide-surface-border/50">
                {history.map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors">
                    <div>
                      <p className="text-white text-sm">{TYPE_LABELS[ev.type] || ev.type}</p>
                      <p className="text-gray-500 text-xs">{new Date(ev.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-medium text-sm ${ev.type === 'WITHDRAWAL' ? 'text-red-400' : 'text-brand-light'}`}>
                      {ev.type === 'WITHDRAWAL' ? '-' : '+'}{ev.amountRlusd.toFixed(4)} RLUSD
                    </span>
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
