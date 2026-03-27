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
              disabled={!(summary?.balance > 0 || merchant?.rewardBalance > 0)}
              className="btn-primary text-sm disabled:opacity-40"
            >
              Withdraw RLUSD
            </button>
          </div>

          {showWithdraw && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="card w-full max-w-sm">
                <h2 className="text-white font-semibold mb-4">Withdraw Rewards</h2>
                <form onSubmit={withdraw} className="space-y-3">
                  <div>
                    <label className="label">XRPL destination address</label>
                    <input className="input" placeholder="r..." value={withdrawForm.toAddress} onChange={e => setWithdrawForm(f => ({ ...f, toAddress: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Amount (RLUSD)</label>
                    <input type="number" step="0.0001" min="0.01" className="input" value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowWithdraw(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={withdrawing} className="btn-primary flex-1">{withdrawing ? 'Sending…' : 'Withdraw'}</button>
                  </div>
                </form>
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
