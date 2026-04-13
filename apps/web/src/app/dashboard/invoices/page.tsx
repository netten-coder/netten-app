'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const DEFAULT_COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'RLUSD']
const STATUS_BADGE: Record<string, string> = { UNPAID:'badge-yellow', PAID:'badge-green', OVERDUE:'badge-red', CANCELLED:'badge-gray' }

interface InvoiceForm { clientName:string; clientEmail:string; amountUsd:string; description:string; dueDate:string; acceptedCoins:string[] }
const EMPTY_FORM: InvoiceForm = { clientName:'', clientEmail:'', amountUsd:'', description:'', dueDate:'', acceptedCoins:DEFAULT_COINS }

function InvoicePreview({ form, merchantName, invoiceNumber }: { form:InvoiceForm; merchantName:string; invoiceNumber:string }) {
  const dueDate = form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'Upon receipt'
  const amount = parseFloat(form.amountUsd) || 0
  return (
    <div className="bg-[#f8fafc] rounded-2xl p-5 h-full">
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Live Preview</p>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-brand-dark px-5 py-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">NETTEN</span>
          <span className="ml-auto text-gray-400 text-xs font-mono">{invoiceNumber}</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-gray-400 text-xs mb-0.5">Invoice from</p>
          <p className="text-gray-900 font-semibold text-sm mb-3">{merchantName||'Your Business'}</p>
          <div className="space-y-0 mb-3 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">Billed to</span>
              <span className="text-gray-800 font-medium truncate max-w-[160px]">{form.clientName||'—'}</span>
            </div>
            {form.description && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">Description</span>
                <span className="text-gray-800 truncate max-w-[160px]">{form.description}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">Due date</span>
              <span className="text-gray-800">{dueDate}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs">Amount due</span>
            <span className="text-gray-900 text-xl font-bold">{amount>0?`$${amount.toFixed(2)}`:'$0.00'}</span>
          </div>
          <button disabled className="w-full bg-brand text-white font-bold py-2.5 rounded-xl text-xs opacity-90 cursor-default">
            Pay {amount>0?`$${amount.toFixed(2)}`:''} now →
          </button>
          <p className="text-gray-300 text-xs text-center mt-2">Pay in any crypto · Settles in RLUSD on XRP Ledger</p>
        </div>
      </div>
      <p className="text-gray-400 text-xs text-center mt-3">Client receives this by email with a live Pay Now button</p>
    </div>
  )
}

export default function InvoicesPage() {
  const { merchant } = useAuth()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string|null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<any>(null)
  const invoiceNumber = `INV-${String((invoices.length+1)).padStart(4,'0')}`
  const load = useCallback(() => { api.invoices.list().then((d:any)=>setInvoices(d.invoices||[])).catch(console.error).finally(()=>setLoading(false)) },[])
  useEffect(()=>{ load() },[load])

  // Poll every 10s so PAID status updates appear without manual refresh
  useEffect(() => {
    const interval = setInterval(() => { load() }, 10000)
    return () => clearInterval(interval)
  }, [load])

  async function createInvoice(e:React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api.invoices.create({...form,amountUsd:parseFloat(form.amountUsd)}); setShowForm(false); setForm(EMPTY_FORM); load() }
    catch(err:any){ alert(err.message) } finally{ setSaving(false) }
  }

  async function sendInvoice(id:string) {
    setSending(id)
    try { await (api as any).invoices.send(id); alert('Invoice sent!') }
    catch(err:any){ alert(err.message) } finally{ setSending(null) }
  }

  async function cancel(id:string) { if(!confirm('Cancel this invoice?'))return; await api.invoices.cancel(id); load() }
  const merchantName = merchant?.businessName||merchant?.email?.split('@')[0]||'Your Business'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg h-[80vh] bg-surface rounded-2xl overflow-hidden border border-surface-border">
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <a 
                href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://netten.app'}/pay/${previewInvoice.payLinkSlug}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-surface-card hover:bg-surface-hover text-gray-400 hover:text-white transition-colors"
                title="Open in new tab"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button 
                onClick={() => setPreviewInvoice(null)}
                className="p-2 rounded-lg bg-surface-card hover:bg-surface-hover text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <iframe 
              src={`${process.env.NEXT_PUBLIC_APP_URL || 'https://netten.app'}/pay/${previewInvoice.payLinkSlug}`}
              className="w-full h-full border-0"
              title="Invoice Preview"
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white font-semibold text-2xl">Invoices</h1><p className="text-gray-400 text-sm mt-0.5">Create, preview, and send crypto invoices</p></div>
        <button onClick={()=>{ setForm(EMPTY_FORM); setShowForm(true) }} className="btn-primary text-sm">+ New Invoice</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
              <h2 className="text-white font-semibold text-lg">New Invoice</h2>
              <button onClick={()=>setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/2 overflow-y-auto p-6 border-r border-surface-border">
                <form onSubmit={createInvoice} className="space-y-4">
                  <div><label className="label">Client name *</label><input className="input" placeholder="John Smith" value={form.clientName} onChange={e=>setForm(f=>({...f,clientName:e.target.value}))} required/></div>
                  <div><label className="label">Client email</label><input type="email" className="input" placeholder="john@example.com" value={form.clientEmail} onChange={e=>setForm(f=>({...f,clientEmail:e.target.value}))}/><p className="text-gray-500 text-xs mt-1">Invoice will be emailed here with Pay Now button</p></div>
                  <div><label className="label">Amount (USD) *</label><input type="number" step="0.01" min="0.01" className="input" placeholder="500.00" value={form.amountUsd} onChange={e=>setForm(f=>({...f,amountUsd:e.target.value}))} required/></div>
                  <div><label className="label">Description / Service</label><input className="input" placeholder="Photography session — 4 hours" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
                  <div><label className="label">Due date</label><input type="date" className="input" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/></div>
                  <div className="pt-2 flex gap-3">
                    <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">{saving?'Creating…':form.clientEmail?'Create & Send':'Create Invoice'}</button>
                  </div>
                </form>
              </div>
              <div className="w-1/2 overflow-y-auto p-6">
                <InvoicePreview form={form} merchantName={merchantName} invoiceNumber={invoiceNumber}/>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-border"><th className="text-left text-gray-400 font-medium px-5 py-3">#</th><th className="text-left text-gray-400 font-medium px-5 py-3">Client</th><th className="text-left text-gray-400 font-medium px-5 py-3">Amount</th><th className="text-left text-gray-400 font-medium px-5 py-3">Status</th><th className="text-left text-gray-400 font-medium px-5 py-3">Due</th><th className="px-5 py-3"/></tr></thead>
            <tbody>
              {loading?(<tr><td colSpan={6} className="py-12 text-center text-gray-500">Loading…</td></tr>):
              !invoices.length?(<tr><td colSpan={6} className="py-12 text-center text-gray-500">No invoices yet</td></tr>):
              invoices.map((inv:any)=>{
                let payLinkUrl=''
                try{ const m=JSON.parse(inv.notes||'{}'); payLinkUrl=m.payLinkUrl||'' }catch{}
                return(
                  <tr key={inv.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3 text-brand-light font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3"><p className="text-white">{inv.clientName}</p>{inv.clientEmail&&<p className="text-gray-500 text-xs">{inv.clientEmail}</p>}</td>
                    <td className="px-5 py-3 text-white font-medium">${inv.amountUsd?.toFixed(2)}</td>
                    <td className="px-5 py-3"><span className={STATUS_BADGE[inv.status]||'badge-gray'}>{inv.status}</span></td>
                    <td className="px-5 py-3 text-gray-400">{inv.dueDate?new Date(inv.dueDate).toLocaleDateString():'—'}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-3 justify-end">
                      {payLinkUrl && (
                        <button 
                          onClick={() => setPreviewInvoice(inv)}
                          className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors group"
                          title="Preview invoice"
                        >
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      {inv.status!=='CANCELLED'&&inv.status!=='PAID'&&inv.clientEmail&&<button onClick={()=>sendInvoice(inv.id)} disabled={sending===inv.id} className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40">{sending===inv.id?'Sending…':'Send'}</button>}
                      {inv.status!=='CANCELLED'&&inv.status!=='PAID'&&<button onClick={()=>cancel(inv.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Cancel</button>}
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
