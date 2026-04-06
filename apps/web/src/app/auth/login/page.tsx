'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email)
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-dark">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">NETTEN</span>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-1">We sent a login link to</p>
              <p className="text-brand-light font-medium text-sm">{email}</p>
              <p className="text-gray-500 text-xs mt-3">Link expires in 10 minutes</p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-white font-semibold text-lg mb-1">Sign in to NETTEN</h1>
              <p className="text-gray-400 text-sm mb-5">Enter your email and we'll send a magic link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="input"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
                )}

                <button type="submit" disabled={loading || !email} className="btn-primary w-full">
                  {loading ? 'Sending…' : 'Send magic link →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          By signing in, you agree to NETTEN's Terms of Service
        </p>
      </div>
    </div>
  )
}
