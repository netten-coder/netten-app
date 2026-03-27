'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PERIODS = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

const COIN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#9945FF',
  XRP: '#00AAE4',
  RLUSD: '#1D9E75',
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.merchant.analytics(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Payment volume and top coins</p>
        </div>
        <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.value ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Total Volume</p>
              <p className="text-white font-bold text-2xl">${(data?.totalVolume || 0).toFixed(2)}</p>
              <p className="text-gray-500 text-xs mt-0.5">RLUSD settled</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Transactions</p>
              <p className="text-white font-bold text-2xl">{data?.txnCount || 0}</p>
              <p className="text-gray-500 text-xs mt-0.5">completed</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-xs mb-1">Avg. Transaction</p>
              <p className="text-white font-bold text-2xl">${(data?.avgTxnSize || 0).toFixed(2)}</p>
              <p className="text-gray-500 text-xs mt-0.5">per payment</p>
            </div>
          </div>

          {/* Top coins chart */}
          <div className="card">
            <h3 className="text-white font-medium mb-5">Top Coins by Volume</h3>
            {!data?.topCoins?.length ? (
              <div className="py-10 text-center text-gray-500 text-sm">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topCoins} barSize={40}>
                  <XAxis
                    dataKey="fromCoin"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#112D24', border: '1px solid #1F4035', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#F1FAF6', fontWeight: 600 }}
                    formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Volume']}
                  />
                  <Bar dataKey="_sum.netAmount" radius={[6, 6, 0, 0]}>
                    {data.topCoins.map((entry: any) => (
                      <Cell key={entry.fromCoin} fill={COIN_COLORS[entry.fromCoin] || '#1D9E75'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top coins table */}
          {data?.topCoins?.length > 0 && (
            <div className="card mt-4 p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left text-gray-400 font-medium px-5 py-3">Coin</th>
                    <th className="text-left text-gray-400 font-medium px-5 py-3">Volume (RLUSD)</th>
                    <th className="text-left text-gray-400 font-medium px-5 py-3">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCoins.map((c: any) => {
                    const pct = data.totalVolume > 0 ? ((c._sum.netAmount / data.totalVolume) * 100).toFixed(1) : '0'
                    return (
                      <tr key={c.fromCoin} className="border-b border-surface-border/50">
                        <td className="px-5 py-3 font-bold" style={{ color: COIN_COLORS[c.fromCoin] || '#1D9E75' }}>{c.fromCoin}</td>
                        <td className="px-5 py-3 text-white">${(c._sum.netAmount || 0).toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface-border rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: COIN_COLORS[c.fromCoin] || '#1D9E75' }} />
                            </div>
                            <span className="text-gray-400 text-xs w-10">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
