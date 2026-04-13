'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const COINS = [
  { id: 'RLUSD', label: 'RLUSD',    symbol: 'RLUSD', color: '#1D9E75', icon: '💵' },
  { id: 'XRP',   label: 'XRP',      symbol: 'XRP',   color: '#00AAE4', icon: '✕' },
  { id: 'BTC',   label: 'Bitcoin',  symbol: 'BTC',   color: '#F7931A', icon: '₿' },
  { id: 'ETH',   label: 'Ethereum', symbol: 'ETH',   color: '#627EEA', icon: 'Ξ' },
  { id: 'SOL',   label: 'Solana',   symbol: 'SOL',   color: '#9945FF', icon: '◎' },
  { id: 'XLM',   label: 'Stellar',  symbol: 'XLM',   color: '#14B6E7', icon: '✦' },
  { id: 'ADA',   label: 'Cardano',  symbol: 'ADA',   color: '#0033AD', icon: '₳' },
  { id: 'HBAR',  label: 'Hedera',   symbol: 'HBAR',  color: '#3D3D3D', icon: 'ℏ' },
]

type Step = 'select' | 'qr' | 'waiting' | 'done' | 'error'

const WALLET_APPS: Record<string, string[]> = {
  BTC:   ['Coinbase', 'Trust Wallet', 'Bitcoin.com Wallet'],
  ETH:   ['Coinbase', 'MetaMask', 'Trust Wallet'],
  SOL:   ['Phantom', 'Coinbase', 'Solflare'],
  XRP:   ['Xaman', 'Coinbase', 'Trust Wallet'],
  RLUSD: ['Xaman', 'Coinbase', 'Trust Wallet'],
  XLM:   ['Lobstr', 'Coinbase', 'Trust Wallet'],
  ADA:   ['Yoroi', 'Daedalus', 'Trust Wallet'],
  HBAR:  ['HashPack', 'Blade', 'Wallawallet'],
}

// Fee constants
const PLATFORM_FEE_RATE = 0.01  // 1% platform fee
const CONVERSION_FEE_RATE = 0.01 // 1% conversion fee

export default function PayPage() {
  const { slug } = useParams<{ slug: string }>()
  const [link, setLink] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('select')
  const [selectedCoin, setSelectedCoin] = useState<string>('RLUSD')
  const [amount, setAmount] = useState('')
  const [txn, setTxn] = useState<any>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadingMoonpay, setLoadingMoonpay] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Fee calculations - 2% total (1% platform + 1% conversion)
  const baseAmount = link?.amountUsd || parseFloat(amount) || 0
  const platformFee = parseFloat((baseAmount * PLATFORM_FEE_RATE).toFixed(2))
  const conversionFee = parseFloat((baseAmount * CONVERSION_FEE_RATE).toFixed(2))
  const totalFees = parseFloat((platformFee + conversionFee).toFixed(2))
  const totalAmount = parseFloat((baseAmount + totalFees).toFixed(2))

  async function initiate() {
    if (!selectedCoin) return
    try {
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

  // Merchant branding
  const businessName = link?.merchant?.businessName || link?.merchant?.email?.split('@')[0] || 'Merchant'
  const initials = businessName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const merchantLogo = link?.merchant?.logoUrl
  
  const selectedCoinData = COINS.find(c => c.id === selectedCoin) || COINS[0]

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
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-start px-4 py-6 md:py-12">
      <div className="w-full max-w-sm">

        {/* HEADER: NETTEN logo (left) | Merchant logo + name (right) */}
        <div className="flex items-center justify-between mb-8">
          {/* NETTEN branding - LEFT */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
              <span className="text-white font-bold text-base">N</span>
            </div>
            <span className="text-gray-500 font-medium text-sm tracking-tight">NETTEN</span>
          </div>

          {/* Merchant branding - RIGHT */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-semibold text-sm leading-tight">{businessName}</p>
              <p className="text-gray-500 text-xs">Merchant</p>
            </div>
            {merchantLogo ? (
              <img src={merchantLogo} alt={businessName} className="w-10 h-10 rounded-xl object-cover shadow-lg" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/80 to-brand flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
            )}
          </div>
        </div>

        {/* PAYMENT AMOUNT DISPLAY */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm mb-2">Payment Request</p>
          {link.amountUsd ? (
            <p className="text-white font-bold text-5xl tracking-tight">${link.amountUsd.toFixed(2)}</p>
          ) : (
            <p className="text-gray-300 text-xl">{link.description}</p>
          )}
          {link.amountUsd && link.description && (
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">{link.description}</p>
          )}
        </div>

        {/* STEP 1: SELECT CRYPTO (DROPDOWN) */}
        {step === 'select' && (
          <div className="space-y-4">
            
            {/* Custom amount input if no fixed amount */}
            {!link.amountUsd && (
              <div className="mb-4">
                <label className="block text-gray-400 text-xs font-medium mb-2">Enter Amount (USD)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-center text-2xl font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="0.00" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
            )}

            {/* Crypto Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-gray-400 text-xs font-medium mb-2">Pay with</label>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border-2 border-surface-border bg-surface-card hover:border-brand/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ background: selectedCoinData.color + '25', color: selectedCoinData.color }}
                  >
                    {selectedCoinData.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">{selectedCoinData.label}</p>
                    <p className="text-gray-500 text-xs">{selectedCoinData.symbol}</p>
                  </div>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-2 py-2 rounded-2xl border border-surface-border bg-surface-card shadow-2xl shadow-black/50 overflow-hidden">
                  {COINS.map(coin => {
                    const accepted = !link.acceptedCoins?.length || link.acceptedCoins.includes(coin.id)
                    const isSelected = selectedCoin === coin.id
                    return (
                      <button
                        key={coin.id}
                        disabled={!accepted}
                        onClick={() => {
                          if (accepted) {
                            setSelectedCoin(coin.id)
                            setDropdownOpen(false)
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                          isSelected 
                            ? 'bg-brand/10' 
                            : accepted 
                              ? 'hover:bg-surface-border/30' 
                              : 'opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base"
                          style={{ background: coin.color + '25', color: coin.color }}
                        >
                          {coin.icon}
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-white font-medium">{coin.label}</p>
                          <p className="text-gray-500 text-xs">{coin.symbol}</p>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {!accepted && (
                          <span className="text-xs text-gray-600">Not accepted</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* FEE BREAKDOWN: 1% Platform + 1% Conversion = 2% Total */}
            {(link.amountUsd || amount) && (
              <div className="bg-surface-card border border-surface-border rounded-2xl p-4 space-y-2.5">
                <p className="text-gray-400 text-xs font-medium mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  Fee Breakdown
                </p>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-300">${baseAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform fee (1%)</span>
                  <span className="text-gray-300">+${platformFee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conversion fee (1%)</span>
                  <span className="text-gray-300">+${conversionFee.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-surface-border pt-2.5 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Total to pay</span>
                    <span className="text-brand font-bold text-lg">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button 
              onClick={initiate} 
              disabled={!selectedCoin || (!link.amountUsd && !amount)}
              className="w-full bg-brand hover:bg-brand/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-brand/20 hover:shadow-brand/30"
            >
              Continue with {selectedCoinData.label} →
            </button>

            {/* OR divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-gray-600 text-xs font-medium">OR</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            {/* Card Payment Option */}
            <button
              onClick={payWithCard}
              disabled={loadingMoonpay || (!link.amountUsd && !amount)}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-surface-border bg-surface-card hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-medium">{loadingMoonpay ? 'Opening…' : 'Pay with Card'}</p>
                <p className="text-gray-500 text-xs">Visa · Mastercard · Apple Pay</p>
              </div>
              <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-1 rounded-lg">via MoonPay</span>
            </button>
          </div>
        )}

        {/* STEP 2: QR CODE */}
        {step === 'qr' && txn && (
          <div className="text-center">
            <div className="inline-block p-5 bg-white rounded-3xl mb-5 shadow-2xl">
              <QRCodeSVG value={txn.payAddress} size={200} bgColor="white" fgColor="#041E17" level="M" />
            </div>

            <p className="text-gray-500 text-xs font-mono break-all bg-surface-card border border-surface-border rounded-xl px-4 py-3 mb-4">
              {txn.payAddress}
            </p>

            <button 
              onClick={copyAddress}
              className={`w-full py-3.5 rounded-xl font-semibold mb-5 transition-all ${
                copied
                  ? 'bg-brand/20 text-brand border border-brand/40'
                  : 'bg-brand text-white hover:bg-brand/90 shadow-lg shadow-brand/20'
              }`}
            >
              {copied ? '✓ Address Copied!' : 'Copy Address'}
            </button>

            {/* Payment Summary */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-4 text-left mb-5">
              <p className="text-gray-400 text-xs font-medium mb-3">Payment Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-gray-300">${baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform fee (1%)</span>
                  <span className="text-gray-300">+${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conversion fee (1%)</span>
                  <span className="text-gray-300">+${conversionFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-surface-border pt-2 mt-2">
                  <span className="text-white font-medium">Send exactly</span>
                  <span className="text-brand font-bold">{txn.payAmount} {txn.fromCoin}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-4 text-left mb-5">
              <p className="text-gray-400 text-xs font-medium mb-3">How to send {selectedCoin}</p>
              <div className="space-y-3">
                {[
                  `Open your wallet (${(WALLET_APPS[selectedCoin || 'XRP'] || ['Coinbase', 'Trust Wallet']).slice(0, 2).join(' or ')})`,
                  'Tap "Send" and scan the QR code above',
                  `Enter exactly ${txn.payAmount} ${txn.fromCoin}`,
                  'Confirm and send — arrives in seconds',
                ].map((instruction, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand/20 border border-brand/30 text-brand text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-gray-400 text-sm leading-relaxed">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setStep('waiting')} 
              className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-brand/20"
            >
              I've Sent the Payment
            </button>
          </div>
        )}

        {/* STEP 3: WAITING */}
        {step === 'waiting' && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full border-4 border-brand border-t-transparent animate-spin mx-auto mb-6" />
            <p className="text-white font-bold text-xl mb-2">Confirming Payment...</p>
            <p className="text-gray-400 text-sm">Usually takes 3–15 seconds on XRP Ledger</p>
            <p className="text-gray-600 text-xs mt-6">You can close this window — your payment will still go through</p>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'done' && (
          <div className="text-center py-10">
            <div className="w-20 h-20 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand/20">
              <svg className="w-10 h-10 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-bold text-3xl mb-3">Payment Complete!</p>
            <p className="text-gray-400 mb-1">
              ${totalAmount.toFixed(2)} sent to {businessName}
            </p>
            <p className="text-gray-600 text-sm">Settled in RLUSD on XRP Ledger</p>
          </div>
        )}

        {/* ERROR STATE */}
        {step === 'error' && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white font-bold text-xl mb-2">Something Went Wrong</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button 
              onClick={() => { setStep('select'); setError(''); setTxn(null) }} 
              className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-4 rounded-2xl transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-gray-700 text-xs text-center mt-10">
          Powered by <span className="text-gray-500 font-medium">NETTEN</span> · netten.app
        </p>
      </div>
    </div>
  )
}
