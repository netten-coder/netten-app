'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, setAccessToken } from '@/lib/api'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No token provided.')
      return
    }

    api.auth.verify(token)
      .then((data: any) => {
        setAccessToken(data.accessToken)
        if (typeof window !== 'undefined' && data.merchant) {
          localStorage.setItem('netten_merchant', JSON.stringify(data.merchant))
        }
        setStatus('success')
        router.replace('/dashboard')
      })
      .catch((err: any) => {
        setStatus('error')
        setMessage(err.message || 'Invalid or expired link.')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-dark">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">Netten</span>
        </div>
        <div className="card text-center py-8">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Verifying your link…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg">Signed in!</p>
              <p className="text-gray-400 text-sm mt-1">Taking you to your dashboard…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg mb-2">Link invalid</p>
              <p className="text-gray-400 text-sm mb-5">{message}</p>
              <button onClick={() => router.push('/auth/login')} className="btn-primary">
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
