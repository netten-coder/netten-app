'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const COINS = ['All', 'BTC', 'ETH', 'SOL', 'XRP', 'RLUSD']
const STATUSES = ['All', 'COMPLETED', 'PENDING', 'FAILED']

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'badge-green',
  PENDING: 'badge-yellow',
  FAILED: 'badge-red',
  REFUNDED: 'badge-gray',
}

export default function PaymentsPage() {
  const [data, setData] = useState<{ transactions: any[]; pagination: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [coin, setCoin] = useState('All')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  function load() {
    setLoading(true)
    api.transactions.list({
      ...(coin !== 'All' && { fromCoin: coin }),
      ...(status !== 'All' && { status }),
      page,
    })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [coin, status, page])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Payments</h1>
          <p className="text-gray-400 text-sm mt-0.5">All incoming crypto transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
          {COINS.map(c => (
            <button
              key={c}
              onClick={() => { setCoin(c); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                coin === c ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === s ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left text-gray-400 font-medium px-5 py-3">Coin</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Description</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Gross</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Net (RLUSD)</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Status</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">Loading…</td>
                </tr>
              ) : !data?.transactions?.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">No transactions found</td>
                </tr>
              ) : (
                data.transactions.map((txn: any) => (
                  <tr key={txn.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-bold text-brand-light">{txn.fromCoin}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">{txn.description || '—'}</td>
                    <td className="px-5 py-3 text-white">${txn.toAmount?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-brand-light font-medium">${txn.netAmount?.toFixed(4)}</td>
                    <td className="px-5 py-3">
                      <span className={STATUS_BADGE[txn.status] || 'badge-gray'}>{txn.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{new Date(txn.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
            <p className="text-gray-500 text-xs">
              Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.pages}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
