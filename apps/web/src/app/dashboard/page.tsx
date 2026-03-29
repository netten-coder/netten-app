'use client'
import { useEffect, useState } from 'react'
import { api, setAccessToken } from '@/lib/api'
import Link from 'next/link'

interface DashboardData {
  merchant: any
  recentTransactions: any[]
  pendingInvoices: any[]
  activePaymentLinks: number
  today: { revenue: number; txns: number }
  rewards: { totalEarned: number }
}

const COIN_COLORS: Record<string, string> = {
  BTC: 'text-orange-400',
  ETH: 'text-blue-400',
  SOL: 'text-purple-400',
  XRP: 'text-cyan-400',
  RLUSD: 'text-brand-light',
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'badge-green',
  PENDING: 'badge-yellow',
  FAILED: 'badge-red',
  REFUNDED: 'badge-gray',
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="card flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center text-brand shrink-0">{icon}</div>
      <div>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold text-xl">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('netten_token')
    if (!stored) {
      window.location.href = '/auth/login'
      return
    }
    if (stored) setAccessToken(stored)
    api.merchant.dashboard()
      .then(setData)
      .catch(() => { window.location.href = '/auth/login' })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <p className="text-gray-400">Unable to load dashboard. Please try refreshing.</p>
      </div>
    )
  }

  const d = data

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">
            {d?.merchant?.businessName ? `Welcome back, ${d.merchant.businessName}` : 'Dashboard'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Here's what's happening with Netten today.</p>
        </div>
        <Link href="/dashboard/links" className="btn-primary text-sm">
          + New Pay Link
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Today's Revenue"
          value={`$${(d?.today?.revenue || 0).toFixed(2)}`}
          sub={`${d?.today?.txns || 0} transactions`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Pay Links"
          value={String(d?.activePaymentLinks || 0)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />
        <StatCard
          label="Pending Invoices"
          value={String(d?.pendingInvoices?.length || 0)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Rewards Earned"
          value={`${(d?.rewards?.totalEarned || 0).toFixed(2)} RLUSD`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
      </div>

      {/* XRPL wallet warning */}
      {!d?.merchant?.xrplAddress && (
        <div className="mb-6 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-yellow-300 text-sm flex-1">
            No XRPL wallet connected — payments can't settle until you add one.{' '}
            <Link href="/dashboard/settings" className="underline hover:text-yellow-200">Add wallet →</Link>
          </p>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Recent Transactions</h2>
          <Link href="/dashboard/payments" className="text-brand text-sm hover:text-brand-light transition-colors">
            View all →
          </Link>
        </div>

        {!d?.recentTransactions?.length ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No transactions yet.</p>
            <p className="text-gray-600 text-xs mt-1">Create a pay link and share it to start accepting payments.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {d.recentTransactions.map((txn: any) => (
              <div key={txn.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${COIN_COLORS[txn.fromCoin] || 'text-gray-400'}`}>
                    {txn.fromCoin}
                  </span>
                  <div>
                    <p className="text-white text-sm">{txn.description || 'Direct payment'}</p>
                    <p className="text-gray-500 text-xs">{new Date(txn.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">${txn.netAmount?.toFixed(2)}</p>
                  <span className={STATUS_BADGE[txn.status] || 'badge-gray'}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
