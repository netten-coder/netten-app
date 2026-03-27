'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function Home() {
  const { merchant, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(merchant ? '/dashboard' : '/auth/login')
    }
  }, [merchant, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <p className="text-gray-500 text-sm">Loading Netten…</p>
      </div>
    </div>
  )
}
