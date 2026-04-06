'use client'
import { useEffect, useState } from 'react'

export function LiveSpotCounter() {
  const [spots, setSpots] = useState<{total:number,remaining:number,claimed:number}|null>(null)

  useEffect(() => {
    const fetchSpots = async () => {
      const res = await fetch('https://netten-app-production.up.railway.app/api/email/waitlist/spots')
      setSpots(await res.json())
    }
    fetchSpots()
    const interval = setInterval(fetchSpots, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!spots) return <div className="text-zinc-400">Loading...</div>
  const pct = (spots.remaining / spots.total) * 100
  const color = pct < 20 ? 'text-red-400' : pct < 50 ? 'text-amber-400' : 'text-teal-400'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${color}`}>{spots.remaining}</span>
        <span className="text-zinc-400">of {spots.total}</span>
      </div>
      <p className="text-zinc-300 text-sm">Founding spots remaining</p>
      <div className="w-full max-w-xs h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{width: `${pct}%`}} />
      </div>
    </div>
  )
}
