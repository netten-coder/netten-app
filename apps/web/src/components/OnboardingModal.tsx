'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { number:1, title:'Connect your XRPL wallet', description:"Go to Settings and paste your XRP Ledger wallet address. This is where all your RLUSD payments settle — instantly after every transaction.", action:'Go to Settings →', href:'/dashboard/settings', tip:"No wallet yet? Download Xaman (xaman.app) — it's free and takes 2 minutes." },
  { number:2, title:'Create your first Pay Link', description:"Click Pay Links then + New Link. Enter a description and amount. Share the link with any client — they can pay in BTC, ETH, SOL, XRP, or RLUSD.", action:'Create a Pay Link →', href:'/dashboard/links', tip:'Your link works on any device. No Netten account needed for your client.' },
  { number:3, title:'Send a crypto invoice', description:"Go to Invoices and click + New Invoice. Fill in client details and watch the live preview update. Hit Create & Send to email your client with a Pay Now button.", action:'Create an Invoice →', href:'/dashboard/invoices', tip:'A dedicated pay link is auto-generated for every invoice. When paid, the invoice marks PAID automatically.' },
  { number:4, title:'Get paid in any crypto', description:"Your client opens the link, picks their crypto, scans the QR code, and sends. You receive the equivalent in RLUSD — the dollar-pegged stablecoin on the XRP Ledger.", tip:'Payments confirm in 3-5 seconds. No waiting, no banks, no borders.' },
  { number:5, title:'Earn rewards automatically', description:"Every 10 transactions, Netten deposits RLUSD directly to your wallet. Rewards start at $0.25 and grow each quarter — up to $2.00 per milestone. Zero effort.", action:'View Rewards →', href:'/dashboard/rewards', tip:'Q1: $0.25 → Q2: $0.50 → Q3: $1.00 → Q4: $2.00 per milestone. It compounds automatically.' },
]

interface Props { onClose: () => void }

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function handleClose() {
    if (typeof window !== 'undefined') localStorage.setItem('netten_onboarding_complete', 'true')
    onClose()
  }

  function handleAction() {
    handleClose()
    if (current.href) router.push(current.href)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="h-1 bg-surface-border">
          <div className="h-full bg-brand transition-all duration-500" style={{ width: `${((step+1)/STEPS.length)*100}%` }} />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center"><span className="text-white font-bold text-xs">N</span></div>
            <span className="text-white font-semibold text-sm">Welcome to Netten</span>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors text-xs">Skip tour</button>
        </div>
        <div className="px-6 py-8">
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_,i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i===step?'bg-brand w-6':i<step?'bg-brand/40 w-3':'bg-surface-border w-3'}`} />
            ))}
          </div>
          <p className="text-brand text-xs font-semibold uppercase tracking-widest mb-2">Step {current.number} of {STEPS.length}</p>
          <h2 className="text-white font-bold text-2xl mb-3 leading-tight">{current.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">{current.description}</p>
          <div className="flex items-start gap-2 bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-6">
            <svg className="w-4 h-4 text-brand shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            <p className="text-brand-light text-xs leading-relaxed">{current.tip}</p>
          </div>
          <div className="flex gap-3">
            {step > 0 && <button onClick={()=>setStep(s=>s-1)} className="btn-secondary px-4 py-2.5 text-sm">← Back</button>}
            {current.action && current.href && <button onClick={handleAction} className="btn-secondary px-4 py-2.5 text-sm flex-1">{current.action}</button>}
            <button onClick={()=>{ if(isLast){handleClose()}else{setStep(s=>s+1)} }} className="btn-primary px-4 py-2.5 text-sm flex-1">{isLast?'🎉 Start using Netten':'Next →'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
