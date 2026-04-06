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

const WALLET_APPS: Record<string, string[]> = {
  BTC:   ['Coinbase', 'Trust Wallet', 'Bitcoin.com Wallet'],
  ETH:   ['Coinbase', 'MetaMask', 'Trust Wallet'],
  SOL:   ['Phantom', 'Coinbase', 'Solflare'],
  XRP:   ['Xaman', 'Coinbase', 'Trust Wallet'],
  RLUSD: ['Xaman', 'Coinbase', 'Trust Wallet'],
}

export default function PayPage() {
  const { slug } = useParams<{ slug: string }>()
  const [link, setLink] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('select')
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [txn, setTxn] = useState<any>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadingMoonpay, setLoadingMoonpay] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`${API_URL}/api/v1/payment-links/resolve/${slug}`)
      .then(async res => {
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `Error ${res.status}`) }
        return res.json()
      })
      .then((data: any) => { setLink(data); if (data.isExpired) setError('expired') })
      .catch(() => setError('Payment link not found.'))
      .finally(() => setLoading(false))
  }, [slug])

  // 1% network fee added on top for customer
  const baseAmount = link?.amountUsd || parseFloat(amount) || 0
  const networkFee = parseFloat((baseAmount * 0.01).toFixed(2))
  const totalAmount = parseFloat((baseAmount + networkFee).toFixed(2))

  async function initiate() {
    if (!selectedCoin) return
    try {
      // Pass total (base + 1% fee) as the amount customer sends
      const res = await api.transactions.initiate({
        fromCoin: selectedCoin,
        amountUsd: totalAmount,
        source: 'PAYMENT_LINK',
      })
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

  function copyAddress() {
    navigator.clipboard.writeText(txn.payAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function payWithCard() {
    if (!link.amountUsd && !amount) return
    setLoadingMoonpay(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/payment-links/moonpay-onramp/${slug}?amount=${totalAmount}`)
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank', 'width=480,height=700,left=200,top=100')
      } else {
        setError(data.error || 'Failed to open card payment')
      }
    } catch {
      setError('Failed to connect to card payment provider')
    } finally {
      setLoadingMoonpay(false)
    }
  }

  // ── Merchant avatar initials ──────────────────────────────────────────────
  const businessName = link?.merchant?.businessName || link?.merchant?.email?.split('@')[0] || 'Merchant'
  const initials = businessName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )

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

        {/* NETTEN header */}
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand/30">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-white font-semibold tracking-tight">NETTEN</span>
        </div>

        {/* Merchant identity + amount */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand/30">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
          <p className="text-white font-semibold text-base">{businessName}</p>
          <p className="text-gray-400 text-sm mb-3">is requesting payment</p>
          {link.amountUsd
            ? <p className="text-white font-bold text-4xl">${link.amountUsd.toFixed(2)}</p>
            : <p className="text-gray-300 text-lg">{link.description}</p>
          }
          {link.amountUsd && link.description && (
            <p className="text-gray-500 text-sm mt-1">{link.description}</p>
          )}
        </div>

        {/* ── Step 1: Select coin ─────────────────────────────────────────── */}
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm text-center mb-2">Choose how you'd like to pay</p>

            {!link.amountUsd && (
              <div className="mb-2">
                <label className="label">Amount (USD)</label>
                <input type="number" step="0.01" min="0.01" className="input text-center text-xl font-semibold"
                  placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
            )}

            {COINS.map(c => {
              const accepted = !link.acceptedCoins?.length || link.acceptedCoins.includes(c.id)
              return (
                <button key={c.id} disabled={!accepted} onClick={() => setSelectedCoin(c.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 ${
                    selectedCoin === c.id
                      ? 'border-brand bg-brand/10'
                      : accepted
                        ? 'border-surface-border bg-surface-card hover:border-brand/40'
                        : 'border-surface-border/30 bg-surface-card/40 opacity-40 cursor-not-allowed'
                  }`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ background: c.color + '33', color: c.color }}>{c.symbol[0]}</div>
                  <div className="text-left">
                    <p className="text-white font-medium">{c.label}</p>
                    <p className="text-gray-500 text-xs">{c.symbol}</p>
                  </div>
                  {selectedCoin === c.id && (
                    <svg className="w-5 h-5 text-brand ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}

            {/* Fee summary */}
            {(link.amountUsd || amount) && selectedCoin && (
              <div className="card text-xs space-y-1.5 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-gray-300">${baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network fee (1%)</span>
                  <span className="text-gray-300">+${networkFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-surface-border pt-1.5 mt-1">
                  <span className="text-white font-medium">Total to send</span>
                  <span className="text-white font-bold">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button onClick={initiate} disabled={!selectedCoin || (!link.amountUsd && !amount)}
              className="btn-primary w-full mt-4 py-3 text-base">
              Continue →
            </button>

            {/* MoonPay card payment divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-gray-600 text-xs">or</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            <button
              onClick={payWithCard}
              disabled={loadingMoonpay || (!link.amountUsd && !amount)}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-surface-border bg-surface-card hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-150 disabled:opacity-40"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-medium text-sm">{loadingMoonpay ? 'Opening…' : 'Pay with card'}</p>
                <p className="text-gray-500 text-xs">Visa · Mastercard · Apple Pay via MoonPay</p>
              </div>
            </button>
          </div>
        )}

        {/* ── Step 2: QR code ─────────────────────────────────────────────── */}
        {step === 'qr' && txn && (
          <div className="text-center">

            {/* QR code */}
            <div className="inline-block p-4 bg-white rounded-2xl mb-4">
              <QRCodeSVG value={txn.payAddress} size={200} bgColor="white" fgColor="#041E17" level="M" />
            </div>

            {/* Address */}
            <p className="text-gray-500 text-xs font-mono break-all bg-surface-card rounded-xl px-3 py-2 mb-3">
              {txn.payAddress}
            </p>

            {/* Copy button — brand green primary */}
            <button onClick={copyAddress}
              className={`w-full py-3 rounded-xl text-sm font-semibold mb-4 transition-all ${
                copied
                  ? 'bg-brand/20 text-brand border border-brand/40'
                  : 'bg-brand text-white hover:bg-brand/90'
              }`}>
              {copied ? '✓ Address copied!' : 'Copy address'}
            </button>

            {/* Fee breakdown — customer view */}
            <div className="card text-left text-xs space-y-1.5 mb-4">
              <p className="text-gray-400 font-medium mb-2">Payment summary</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="text-gray-300">${baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Network fee (1%)</span>
                <span className="text-gray-300">+${networkFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-surface-border pt-1.5">
                <span className="text-white font-medium">Total sent</span>
                <span className="text-brand-light font-bold">
                  {txn.payAmount} {txn.fromCoin}
                </span>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div className="card text-left text-xs mb-6">
              <p className="text-gray-400 font-medium mb-3">How to send {selectedCoin}</p>
              <div className="space-y-2.5">
                {[
                  `Open your crypto wallet (${(WALLET_APPS[selectedCoin || 'XRP'] || ['Coinbase', 'Trust Wallet']).join(', ')})`,
                  'Tap "Send" and scan the QR code above — or paste the address',
                  `Enter exactly ${txn.payAmount} ${txn.fromCoin} as the amount`,
                  'Confirm and send — payment arrives in 3–15 seconds',
                ].map((instruction, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand/20 border border-brand/30 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-gray-400 leading-relaxed">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep('waiting')} className="btn-primary w-full py-3">
              I've sent the payment
            </button>
          </div>
        )}

        {/* ── Step 3: Waiting ──────────────────────────────────────────────── */}
        {step === 'waiting' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full border-4 border-brand border-t-transparent animate-spin mx-auto mb-5" />
            <p className="text-white font-semibold text-lg">Confirming on-chain…</p>
            <p className="text-gray-400 text-sm mt-2">This usually takes 3–15 seconds on XRP Ledger</p>
            <p className="text-gray-600 text-xs mt-4">You can close this window — your payment will still go through</p>
          </div>
        )}

        {/* ── Step 4: Done ─────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-bold text-2xl mb-2">Payment complete!</p>
            <p className="text-gray-400 text-sm mb-1">
              ${totalAmount.toFixed(2)} sent to {businessName}
            </p>
            <p className="text-gray-600 text-xs">Settled in RLUSD on the XRP Ledger</p>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {step === 'error' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg mb-2">Something went wrong</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button onClick={() => { setStep('select'); setError(''); setTxn(null) }} className="btn-primary w-full">
              Try again
            </button>
          </div>
        )}

        {/* Powered by footer */}
        <p className="text-gray-700 text-xs text-center mt-8">Powered by NETTEN · netten.app</p>

      </div>
    </div>
  )
}
