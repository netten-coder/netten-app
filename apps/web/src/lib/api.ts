// lib/api.ts — Netten API client

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json()
    accessToken = data.accessToken
    return accessToken
  } catch {
    return null
  }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' })
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login:   (email: string) => apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
    verify:  (token: string) => apiFetch(`/api/v1/auth/verify?token=${token}`),
    refresh: () => refreshToken(),
    logout:  () => apiFetch('/api/v1/auth/logout', { method: 'POST' }),
  },

  // ── Merchant ────────────────────────────────────────────────────────────────
  merchant: {
    me:        () => apiFetch('/api/v1/merchant/me'),
    update:    (data: any) => apiFetch('/api/v1/merchant/me', { method: 'PUT', body: JSON.stringify(data) }),
    dashboard: () => apiFetch('/api/v1/merchant/dashboard'),
    analytics: (period?: string) => apiFetch(`/api/v1/merchant/analytics${period ? `?period=${period}` : ''}`),
    addWallet: (xrplAddress: string) => apiFetch('/api/v1/merchant/wallet', { method: 'POST', body: JSON.stringify({ xrplAddress }) }),
    newWallet: () => apiFetch('/api/v1/merchant/wallet/new'),
  },

  // ── Transactions ────────────────────────────────────────────────────────────
  transactions: {
    list:     (params?: { status?: string; fromCoin?: string; page?: number }) => {
      const q = new URLSearchParams(params as any).toString()
      return apiFetch(`/api/v1/transactions${q ? `?${q}` : ''}`)
    },
    get:      (id: string) => apiFetch(`/api/v1/transactions/${id}`),
    initiate: (data: any) => apiFetch('/api/v1/transactions/initiate', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ── Invoices ────────────────────────────────────────────────────────────────
  invoices: {
    list:   (status?: string) => apiFetch(`/api/v1/invoices${status ? `?status=${status}` : ''}`),
    create: (data: any) => apiFetch('/api/v1/invoices', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: string) => apiFetch(`/api/v1/invoices/${id}`, { method: 'DELETE' }),
  },

  // ── Payment Links ───────────────────────────────────────────────────────────
  links: {
    list:    () => apiFetch('/api/v1/payment-links'),
    resolve: (slug: string) => apiFetch(`/api/v1/payment-links/resolve/${slug}`),
    create:  (data: any) => apiFetch('/api/v1/payment-links', { method: 'POST', body: JSON.stringify(data) }),
    delete:  (id: string) => apiFetch(`/api/v1/payment-links/${id}`, { method: 'DELETE' }),
  },

  // ── Rewards ─────────────────────────────────────────────────────────────────
  rewards: {
    summary:  () => apiFetch('/api/v1/rewards/summary'),
    history:  (page?: number) => apiFetch(`/api/v1/rewards/history${page ? `?page=${page}` : ''}`),
    withdraw: (toAddress: string, amount: number) =>
      apiFetch('/api/v1/rewards/withdraw', { method: 'POST', body: JSON.stringify({ toAddress, amount }) }),
  },
}
