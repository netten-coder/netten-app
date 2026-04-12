'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://netten.app'

export default function LinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amountUsd: '', maxUses: '', expiresAt: '' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function load() {
    api.links.list()
      .then((d: any) => setLinks(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function createLink(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.links.create({
        description: form.description,
        ...(form.amountUsd && { amountUsd: parseFloat(form.amountUsd) }),
        ...(form.maxUses && { maxUses: parseInt(form.maxUses) }),
        ...(form.expiresAt && { expiresAt: form.expiresAt }),
      })
      setShowForm(false)
      setForm({ description: '', amountUsd: '', maxUses: '', expiresAt: '' })
      load()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteLink(id: string) {
    if (!confirm('Deactivate this pay link?')) return
    setDeleting(id)
    try {
      await api.links.delete(id)
      load()
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert(`Failed to delete: ${err.message || 'Unknown error'}`)
    } finally {
      setDeleting(null)
    }
  }

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Preview in same page (not new tab)
  function previewLink(slug: string) {
    router.push(`/pay/${slug}`)
  }

  // Extract slug from URL
  function getSlugFromUrl(url: string): string {
    const parts = url.split('/pay/')
    return parts[1] || ''
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Pay Links</h1>
          <p className="text-gray-400 text-sm mt-0.5">Share a link — customers pay in any crypto</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ New Link</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Create Pay Link</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={createLink} className="space-y-3">
              <div>
                <label className="label">Description *</label>
                <input className="input" placeholder="e.g. Photography session" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Amount USD (leave blank for any amount)</label>
                <input type="number" step="0.01" min="0" className="input" placeholder="50.00" value={form.amountUsd} onChange={e => setForm(f => ({ ...f, amountUsd: e.target.value }))} />
              </div>
              <div>
                <label className="label">Max uses (optional)</label>
                <input type="number" min="1" className="input" placeholder="Unlimited" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
              </div>
              <div>
                <label className="label">Expires at (optional)</label>
                <input type="datetime-local" className="input" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create Link'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : !links.length ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-2">No pay links yet</p>
          <p className="text-gray-600 text-sm">Create one and share it — your customers pay in crypto, you settle in RLUSD.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {links.map((link: any) => (
            <div key={link.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{link.description}</p>
                <p className="text-gray-500 text-xs font-mono truncate">{link.url}</p>
                <div className="flex items-center gap-3 mt-1">
                  {link.amountUsd && <span className="text-brand-light text-xs">${link.amountUsd.toFixed(2)}</span>}
                  <span className="text-gray-600 text-xs">{link.useCount} uses{link.maxUses ? ` / ${link.maxUses}` : ''}</span>
                  {!link.isActive && <span className="badge-gray">Inactive</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyLink(link.url, link.id)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {copied === link.id ? '✓ Copied' : 'Copy'}
                </button>
                {/* Preview in same page instead of new tab */}
                <button 
                  onClick={() => previewLink(getSlugFromUrl(link.url))}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Preview
                </button>
                {link.isActive && (
                  <button 
                    onClick={() => deleteLink(link.id)} 
                    disabled={deleting === link.id}
                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {deleting === link.id ? (
                      <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
