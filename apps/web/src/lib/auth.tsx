'use client'
// lib/auth.ts — Netten auth context

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setAccessToken } from './api'
import { useRouter } from 'next/navigation'

interface Merchant {
  id: string
  email: string
  businessName?: string
  country?: string
  timezone: string
  xrplAddress?: string
  isVerified: boolean
  plan: string
  rewardBalance: number
  totalRewardsEarned: number
}

interface AuthContextType {
  merchant: Merchant | null
  loading: boolean
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
    } catch {
      setMerchant(null)
    }
  }

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('netten_token') : null
    if (stored) {
      setAccessToken(stored)
      api.merchant.me()
        .then(setMerchant)
        .catch(() => refresh())
        .finally(() => setLoading(false))
    } else {
      refresh().finally(() => setLoading(false))
    }
  }, [])

  async function login(email: string) {
    await api.auth.login(email)
  }

  async function logout() {
    await api.auth.logout()
    setAccessToken(null)
    setMerchant(null)
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
