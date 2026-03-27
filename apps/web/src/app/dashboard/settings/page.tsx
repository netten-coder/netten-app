'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function SettingsPage() {
  const { merchant, refresh } = useAuth()
  const [profile, setProfile] = useState({
    businessName: merchant?.businessName || '',
    country: merchant?.country || '',
    timezone: merchant?.timezone || 'UTC',
  })
  const [wallet, setWallet] = useState(merchant?.xrplAddress || '')
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; seed: string } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingWallet, setSavingWallet] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [walletMsg, setWalletMsg] = useState('')

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api.merchant.update(profile)
      await refresh()
      setProfileMsg('Saved!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err: any) {
      setProfileMsg(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveWallet(e: React.FormEvent) {
    e.preventDefault()
    setSavingWallet(true)
    try {
      await api.merchant.addWallet(wallet)
      await refresh()
      setWalletMsg('Wallet saved!')
      setTimeout(() => setWalletMsg(''), 3000)
    } catch (err: any) {
      setWalletMsg(err.message)
    } finally {
      setSavingWallet(false)
    }
  }

  async function generateWallet() {
    setGenerating(true)
    try {
      const w = await api.merchant.newWallet()
      setGeneratedWallet(w)
      setWallet(w.address)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-white font-semibold text-2xl">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your Netten account</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h2 className="text-white font-medium mb-4">Business Profile</h2>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={merchant?.email || ''} disabled />
          </div>
          <div>
            <label className="label">Business name</label>
            <input className="input" value={profile.businessName} onChange={e => setProfile(p => ({ ...p, businessName: e.target.value }))} placeholder="Acme Inc." />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} placeholder="US" />
          </div>
          <div>
            <label className="label">Timezone</label>
            <input className="input" value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))} placeholder="America/New_York" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={savingProfile} className="btn-primary text-sm">
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
            {profileMsg && <span className="text-sm text-brand-light">{profileMsg}</span>}
          </div>
        </form>
      </div>

      {/* XRPL Wallet */}
      <div className="card">
        <h2 className="text-white font-medium mb-1">XRPL Settlement Wallet</h2>
        <p className="text-gray-400 text-sm mb-4">All payments settle here as RLUSD on the XRP Ledger.</p>
        <form onSubmit={saveWallet} className="space-y-3">
          <div>
            <label className="label">XRPL address</label>
            <input className="input font-mono" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="rXXXXXXXXXXXXXXXXXXXXX" />
          </div>

          {generatedWallet && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-300 text-xs font-bold mb-2">⚠ Save your seed phrase — it will never be shown again</p>
              <p className="text-gray-300 text-xs font-mono break-all">{generatedWallet.seed}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="button" onClick={generateWallet} disabled={generating} className="btn-secondary text-sm">
              {generating ? 'Generating…' : 'Generate new wallet'}
            </button>
            <button type="submit" disabled={savingWallet || !wallet} className="btn-primary text-sm">
              {savingWallet ? 'Saving…' : 'Save wallet'}
            </button>
            {walletMsg && <span className="text-sm text-brand-light">{walletMsg}</span>}
          </div>
        </form>
      </div>

      {/* Plan */}
      <div className="card">
        <h2 className="text-white font-medium mb-1">Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-lg font-semibold capitalize">{merchant?.plan || 'Starter'}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {merchant?.plan === 'STARTER' && '1.0% platform fee'}
              {merchant?.plan === 'PRO' && '0.75% platform fee'}
              {merchant?.plan === 'BUSINESS' && '0.50% platform fee'}
              {merchant?.plan === 'ENTERPRISE' && '0.25% platform fee'}
            </p>
          </div>
          <span className="badge-green capitalize">{merchant?.plan}</span>
        </div>
        <p className="text-gray-500 text-xs mt-3">To upgrade, contact <a href="mailto:support@netten.app" className="text-brand hover:underline">support@netten.app</a></p>
      </div>
    </div>
  )
}
