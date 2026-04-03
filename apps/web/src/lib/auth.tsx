'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setAccessToken } from './api'
import { useRouter } from 'next/navigation'

interface Merchant {
  id: string; email: string; businessName?: string; country?: string
  timezone: string; xrplAddress?: string; isVerified: boolean
  plan: string; rewardBalance: number; totalRewardsEarned: number
}
interface AuthContextType {
  merchant: Merchant | null; loading: boolean
  login: (email: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function refresh() {
    try {
      const token = await api.auth.refresh()
      if (!token) { setMerchant(null); return }
      setAccessToken(token)
      const me = await api.merchant.me()
      setMerchant(me)
      if (typeof window !== 'undefined') localStorage.setItem('netten_merchant', JSON.stringify(me))
    } catch {
      setMerchant(null)
      if (typeof window !== 'undefined') localStorage.removeItem('netten_merchant')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') { setLoading(false); return }
    const storedToken = localStorage.getItem('netten_token')
    const storedMerchant = localStorage.getItem('netten_merchant')
    if (!storedToken) { refresh().finally(() => setLoading(false)); return }
    setAccessToken(storedToken)
    if (storedMerchant) {
      try {
        setMerchant(JSON.parse(storedMerchant))
        setLoading(false)
        // FIX: Do NOT call refresh() on failure here.
        // The old code called refresh() which wiped merchant→null→redirect-to-login.
        // The user literally just logged in — keep them logged in.
        api.merchant.me()
          .then(me => { setMerchant(me); localStorage.setItem('netten_merchant', JSON.stringify(me)) })
          .catch(() => { /* silently keep cached merchant in state — token may just be expired */ })
      } catch {
        localStorage.removeItem('netten_merchant')
        api.merchant.me()
          .then(me => { setMerchant(me); localStorage.setItem('netten_merchant', JSON.stringify(me)) })
          .catch(() => refresh())
          .finally(() => setLoading(false))
      }
    } else {
      api.merchant.me()
        .then(me => { setMerchant(me); localStorage.setItem('netten_merchant', JSON.stringify(me)) })
        .catch(() => refresh())
        .finally(() => setLoading(false))
    }
  }, [])

  async function login(email: string) { await api.auth.login(email) }
  async function logout() {
    await api.auth.logout()
    setAccessToken(null)
    setMerchant(null)
    if (typeof window !== 'undefined') localStorage.removeItem('netten_merchant')
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ merchant, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
