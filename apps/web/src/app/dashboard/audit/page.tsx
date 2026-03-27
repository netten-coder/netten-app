'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AuditPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.rewards.history(page)
      .then((d: any) => setHistory(d.events || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const TYPE_ICON: Record<string, React.ReactNode> = {
    TXN_MILESTONE: (
      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    VOLUME_BONUS: (
      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    ),
    WITHDRAWAL: (
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      </div>
    ),
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-2xl">Audit Log</h1>
        <p className="text-gray-400 text-sm mt-0.5">Full record of reward events and on-chain activity</p>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto" />
          </div>
        ) : !history.length ? (
          <div className="py-12 text-center text-gray-500 text-sm">No audit events yet</div>
        ) : (
          <div className="divide-y divide-surface-border/50">
            {history.map((ev: any) => (
              <div key={ev.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-hover transition-colors">
                {TYPE_ICON[ev.type] || <div className="w-8 h-8 rounded-full bg-gray-500/20" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{ev.description}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-gray-500 text-xs">{new Date(ev.createdAt).toLocaleString()}</span>
                    {ev.xrplTxHash && (
                      <a
                        href={`https://livenet.xrpl.org/transactions/${ev.xrplTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand text-xs hover:underline font-mono"
                      >
                        {ev.xrplTxHash.slice(0, 10)}…
                      </a>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium shrink-0 ${ev.type === 'WITHDRAWAL' ? 'text-red-400' : 'text-brand-light'}`}>
                  {ev.type === 'WITHDRAWAL' ? '-' : '+'}{ev.amountRlusd.toFixed(4)} RLUSD
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
          <span className="text-gray-500 text-xs">Page {page}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">
              ← Prev
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={history.length < 20} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
