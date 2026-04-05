'use client'
import { useEffect, useState } from 'react'
import { api, setAccessToken } from '@/lib/api'

const SESSION_OPTIONS = [
  {
    value: '7d',
    label: 'High Security',
    duration: 'Re-authenticate every 7 days',
    description: 'Best for shared or public devices. Most secure.',
    security: 5,
    color: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  {
    value: '30d',
    label: 'Recommended',
    duration: 'Stay logged in for 30 days',
    description: 'Balanced security for personal devices.',
    security: 4,
    color: 'text-brand-light',
    badge: 'bg-brand/20 text-brand-light border-brand/30',
  },
  {
    value: '90d',
    label: 'Maximum Convenience',
    duration: 'Stay logged in for 90 days',
    description: 'Low security. Only use on private devices you own.',
    security: 2,
    color: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
]

function SecurityDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${i <= level ? 'bg-brand' : 'bg-surface-border'}`} />
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [sessionPref, setSessionPref] = useState('30d')
  const [profileSaved, setProfileSaved] = useState(false)
  const [walletSaved, setWalletSaved] = useState(false)
  const [xrplAddress, setXrplAddress] = useState('')
  const [newWallet, setNewWallet] = useState<{ address: string; seed: string } | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('UTC')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('netten_token') : null
    if (!stored) { window.location.href = '/auth/login'; return }
    setAccessToken(stored)
    api.merchant.me().then((m: any) => {
      setMerchant(m)
      setBusinessName(m.businessName || '')
      setCountry(m.country || '')
      setTimezone(m.timezone || 'UTC')
      setXrplAddress(m.xrplAddress || '')
      setSessionPref(m.sessionPreference || '30d')
      const savedAvatar = localStorage.getItem('netten_avatar')
      if (savedAvatar) setAvatar(savedAvatar)
    }).catch(() => { window.location.href = '/auth/login' })
  }, [])

  async function saveProfile() {
    setSaving(true)
    try {
      await api.merchant.update({ businessName, country, timezone, sessionPreference: sessionPref })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch(e) {} finally { setSaving(false) }
  }

  async function generateWallet() {
    try {
      const data = await api.merchant.newWallet()
      setNewWallet(data)
      setXrplAddress(data.address)
    } catch(e) {}
  }

  async function saveWallet() {
    setSaving(true)
    try {
      await api.merchant.addWallet(xrplAddress)
      setWalletSaved(true)
      setNewWallet(null)
      setTimeout(() => setWalletSaved(false), 3000)
    } catch(e) {} finally { setSaving(false) }
  }

  if (!merchant) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-white font-semibold text-2xl">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your Netten account</p>
      </div>

      {/* Profile Avatar */}
      <div className="card space-y-4">
        <h2 className="text-white font-semibold">Profile</h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-brand/20 border-2 border-brand/30 flex items-center justify-center overflow-hidden">
              {avatar
                ? <img src={avatar} alt="logo" className="w-full h-full object-cover" />
                : <span className="text-brand-light font-bold text-2xl uppercase">{businessName?.[0] || merchant?.email?.[0] || 'N'}</span>
              }
            </div>
            {avatar && (
              <button
                onClick={() => { setAvatar(null); localStorage.removeItem('netten_avatar') }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Remove photo"
              >×</button>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium mb-1">{businessName || 'Your Business'}</p>
            <p className="text-gray-400 text-xs mb-3">Upload your logo or profile photo. Shown on your dashboard and pay pages.</p>
            <label className="btn-secondary text-xs cursor-pointer inline-block">
              {avatar ? 'Change photo' : 'Upload photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return }
                  const reader = new FileReader()
                  reader.onload = () => {
                    const result = reader.result as string
                    setAvatar(result)
                    localStorage.setItem('netten_avatar', result)
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>
            <p className="text-gray-600 text-xs mt-1.5">JPG, PNG or GIF · Max 2MB</p>
          </div>
        </div>
      </div>

      {/* Business Profile */}
      <div className="card space-y-4">
        <h2 className="text-white font-semibold">Business Profile</h2>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Email</label>
          <input value={merchant.email} disabled className="input w-full opacity-50 cursor-not-allowed" />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Business name</label>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Inc." className="input w-full" />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Country</label>
          <input value={country} onChange={e => setCountry(e.target.value)} placeholder="US" className="input w-full" />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Timezone</label>
          <input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="UTC" className="input w-full" />
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary">
          {profileSaved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>
      </div>

      {/* XRPL Settlement Wallet */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-white font-semibold">XRPL Settlement Wallet</h2>
          <p className="text-gray-400 text-xs mt-0.5">All payments settle here as RLUSD on the XRP Ledger.</p>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">XRPL address</label>
          <input value={xrplAddress} onChange={e => setXrplAddress(e.target.value)} placeholder="rXXXXXXXXXXXXXXXXXXXX" className="input w-full font-mono text-sm" />
        </div>
        {newWallet && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-2">
            <p className="text-yellow-400 text-xs font-semibold">⚠️ Save your seed phrase — it will never be shown again</p>
            <p className="text-yellow-300 text-xs font-mono break-all">{newWallet.seed}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={generateWallet} className="btn-secondary">Generate new wallet</button>
          <button onClick={saveWallet} disabled={saving} className="btn-primary">
            {walletSaved ? '✓ Saved' : saving ? 'Saving...' : 'Save wallet'}
          </button>
        </div>
      </div>

      {/* Session Security */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-white font-semibold">Session Security</h2>
          <p className="text-gray-400 text-xs mt-0.5">Choose how long you stay logged in on this device. New device logins always trigger a security alert regardless of this setting.</p>
        </div>
        <div className="space-y-3">
          {SESSION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSessionPref(opt.value)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                sessionPref === opt.value
                  ? 'border-brand bg-brand/10'
                  : 'border-surface-border bg-surface hover:border-brand/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    sessionPref === opt.value ? 'border-brand' : 'border-gray-600'
                  }`}>
                    {sessionPref === opt.value && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  <span className="text-white font-medium text-sm">{opt.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${opt.badge}`}>{opt.duration}</span>
                </div>
                <SecurityDots level={opt.security} />
              </div>
              <p className="text-gray-400 text-xs ml-7">{opt.description}</p>
            </button>
          ))}
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary">
          {profileSaved ? '✓ Security preference saved' : saving ? 'Saving...' : 'Save security preference'}
        </button>
      </div>

      {/* Plan */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Plan</h2>
            <p className="text-brand-light font-bold text-lg mt-1">{merchant.plan}</p>
            <p className="text-gray-400 text-xs">1% platform fee</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-brand/20 text-brand-light border border-brand/30">{merchant.plan}</span>
        </div>
        <p className="text-gray-500 text-xs mt-3">To upgrade, contact <a href="mailto:support@netten.app" className="text-brand hover:text-brand-light">support@netten.app</a></p>
      </div>
    </div>
  )
}
