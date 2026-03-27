'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const DEFAULT_COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'RLUSD']

const STATUS_BADGE: Record<string, string> = {
  UNPAID: 'badge-yellow',
  PAID: 'badge-green',
  OVERDUE: 'badge-red',
  CANCELLED: 'badge-gray',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', amountUsd: '', description: '', dueDate: '',
    acceptedCoins: DEFAULT_COINS,
  })
  const [saving, setSaving] = useState(false)

  function load() {
    api.invoices.list()
      .then((d: any) => setInvoices(d.invoices || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.invoices.create({ ...form, amountUsd: parseFloat(form.amountUsd) })
      setShowForm(false)
      setForm({ clientName: '', clientEmail: '', amountUsd: '', description: '', dueDate: '', acceptedCoins: DEFAULT_COINS })
      load()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function cancel(id: string) {
    if (!confirm('Cancel this invoice?')) return
    await api.invoices.cancel(id)
    load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Invoices</h1>
          <p className="text-gray-400 text-sm mt-0.5">Create and track crypto invoices</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ New Invoice</button>
      </div>

      {/* New Invoice Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Invoice</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={createInvoice} className="space-y-3">
              <div>
                <label className="label">Client name *</label>
                <input className="input" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Client email</label>
                <input type="email" className="input" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} />
              </div>
              <div>
                <label className="label">Amount (USD) *</label>
                <input type="number" step="0.01" min="0" className="input" value={form.amountUsd} onChange={e => setForm(f => ({ ...f, amountUsd: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Due date</label>
                <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating…' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left text-gray-400 font-medium px-5 py-3">#</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Client</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Amount</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Status</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500">Loading…</td></tr>
              ) : !invoices.length ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500">No invoices yet</td></tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3 text-brand-light font-mono">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3">
                      <p className="text-white">{inv.clientName}</p>
                      {inv.clientEmail && <p className="text-gray-500 text-xs">{inv.clientEmail}</p>}
                    </td>
                    <td className="px-5 py-3 text-white font-medium">${inv.amountUsd?.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={STATUS_BADGE[inv.status] || 'badge-gray'}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                        <button onClick={() => cancel(inv.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
