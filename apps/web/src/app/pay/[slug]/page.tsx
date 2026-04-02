'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COINS = [
  { id: 'BTC',   label: 'Bitcoin',  symbol: 'BTC',   color: '#F7931A' },
  { id: 'ETH',   label: 'Ethereum', symbol: 'ETH',   color: '#627EEA' },
  { id: 'SOL',   label: 'Solana',   symbol: 'SOL',   color: '#9945FF' },
  { id: 'XRP',   label: 'XRP',      symbol: 'XRP',   color: '#00AAE4' },
  { id: 'RLUSD', label: 'RLUSD',    symbol: 'RLUSD', color: '#1D9E75' },
]
type Step = 'select' | 'qr' | 'waiting' | 'done' | 'error'

export default function PayPage() {
  const { slug } = useParams<{ slug: string }>()
  const [link, setLink] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('select')
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [txn, setTxn] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    fetch(`${API_URL}/api/v1/payment-links/resolve/${slug}`)
      .then(async res => {
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `Error ${res.status}`) }
        return res.json()
      })
      .then(setLink)
      .catch(() => setError('Payment link not found or expired.'))
      .finally(() => setLoading(false))
  }, [slug])

  async function initiate() {
    if (!selectedCoin) return
    try {
      const amountUsd = link.amountUsd || parseFloat(amount)
      const res = await api.transactions.initiate({ fromCoin: selectedCoin, amountUsd, source: 'PAYMENT_LINK' })
      setTxn(res); setStep('qr'); pollStatus(res.transactionId)
    } catch (err: any) { setError(err.message) }
  }

  function pollStatus(txnId: string) {
    const iv = setInterval(async () => {
      try {
        const t = await api.transactions.get(txnId)
        if (t?.status === 'COMPLETED') { setStep('done'); clearInterval(iv) }
        else if (t?.status === 'FAILED') { setStep('error'); setError('Payment failed.'); clearInterval(iv) }
      } catch {}
    }, 3000)
    setTimeout(() => clearInterval(iv), 10 * 60 * 1000)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark"><div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>

  if (error && !link) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <p className="text-white font-semibold text-lg">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-start px-4 py-8 md:py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand/30"><span className="text-white font-bold text-sm">N</span></div>
          <span className="text-white font-semibold tracking-tight">Netten</span>
        </div>
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">{link.merchant?.businessName || 'Merchant'} is requesting</p>
          {link.amountUsd ? <p className="text-white font-bold text-4xl mt-1">${link.amountUsd.toFixed(2)}</p> : <p className="text-gray-300 text-lg mt-1">{link.description}</p>}
          {link.amountUsd && <p className="text-gray-500 text-sm mt-0.5">{link.description}</p>}
        </div>

        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm text-center mb-4">Choose how you'd like to pay</p>
            {!link.amountUsd && (
              <div className="mb-2">
                <label className="label">Amount (USD)</label>
                <input type="number" step="0.01" min="0.01" className="input text-center text-xl font-semibold" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
            )}
            {COINS.map(c => {
              const accepted = !link.acceptedCoins?.length || link.acceptedCoins.includes(c.id)
              return (
                <button key={c.id} disabled={!accepted} onClick={() => setSelectedCoin(c.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 ${selectedCoin === c.id ? 'border-brand bg-brand/10' : accepted ? 'border-surface-border bg-surface-card hover:border-brand/40' : 'border-surface-border/30 bg-surface-card/40 opacity-40 cursor-not-allowed'}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ background: c.color + '33', color: c.color }}>{c.symbol[0]}</div>
                  <div className="text-left"><p className="text-white font-medium">{c.label}</p><p className="text-gray-500 text-xs">{c.symbol}</p></div>
                  {selectedCoin === c.id && <svg className="w-5 h-5 text-brand ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
              )
            })}
            <button onClick={initiate} disabled={!selectedCoin || (!link.amountUsd && !amount)} className="btn-primary w-full mt-4 py-3 text-base">Continue →</button>
          </div>
        )}

        {step === 'qr' && txn && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">Send exactly <span className="text-white font-medium">{txn.payAmount} {txn.fromCoin}</span> to this address</p>
            <div className="inline-block p-4 bg-white rounded-2xl mb-4"><QRCodeSVG value={txn.payAddress} size={200} bgColor="white" fgColor="#041E17" level="M" /></div>
            <p className="text-gray-500 text-xs font-mono break-all bg-surface-card rounded-xl px-3 py-2 mb-4">{txn.payAddress}</p>
            <button onClick={() => navigator.clipboard.writeText(txn.payAddress)} className="btn-secondary w-full text-sm mb-4">Copy address</button>
            <div className="card text-left text-xs space-y-1 mb-6">
              <p className="text-gray-400 font-medium mb-2">Fee breakdown</p>
              {Object.entries(txn.feeBreakdown || {}).map(([k, v]: any) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={k === 'netToMerchant' ? 'text-brand-light font-medium' : 'text-gray-300'}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('waiting')} className="btn-primary w-full py-3">I've sent the payment</button>
          </div>
        )}

        {step === 'waiting' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full border-4 border-brand border-t-transparent animate-spin mx-auto mb-5" />
            <p className="text-white font-semibold text-lg">Confirming on-chain…</p>
            <p className="text-gray-400 text-sm mt-2">This usually takes 3–15 seconds on XRP Ledger</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-bold text-2xl mb-2">Payment complete!</p>
            <p className="text-gray-400 text-sm">Settled in RLUSD on the XRP Ledger.</p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <p className="text-white font-semibold text-lg mb-2">Something went wrong</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button onClick={() => { setStep('select'); setError(''); setTxn(null) }} className="btn-primary w-full">Try again</button>
          </div>
        )}
      </div>
    </div>
  )
}
