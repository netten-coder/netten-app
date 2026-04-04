'use client'
import Link from 'next/link'

export default function GuidePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl mb-1">Getting Started</h1>
        <p className="text-gray-400 text-sm">Everything you need to start accepting crypto payments</p>
      </div>
      <div className="space-y-6">
        {[
          { num:'01', color:'brand', title:'Connect your XRPL wallet', href:'/dashboard/settings', cta:'Go to Settings', steps:['Go to Settings in the left sidebar','Under XRPL Settlement Wallet, paste your XRP Ledger wallet address','Click Save wallet','All payments will now settle as RLUSD to this address'], tip:"Don't have a wallet? Download Xaman at xaman.app — free and takes 2 minutes." },
          { num:'02', color:'blue', title:'Create a Pay Link', href:'/dashboard/links', cta:'Create a Pay Link', steps:['Click Pay Links in the sidebar','Click + New Link','Enter a description and amount in USD','Click Create Link — your shareable link is ready instantly','Copy and send it to your client via text, email, or DM'], tip:'Leave the amount blank to create an open-amount link — your client enters what they owe.' },
          { num:'03', color:'purple', title:'Send a crypto invoice', href:'/dashboard/invoices', cta:'Create an Invoice', steps:['Click Invoices in the sidebar','Click + New Invoice','Fill in client name, email, amount, and description','Watch the live preview update in real time','Click "Create & Send" — client gets an email with a Pay Now button'], tip:"When your client pays, the invoice automatically marks PAID in your dashboard." },
          { num:'04', color:'green', title:'Your client pays in crypto', href:null, cta:null, steps:['Client opens your pay link on any device','They choose their crypto: BTC, ETH, SOL, XRP, or RLUSD','A QR code and wallet address appear for the exact amount','Client sends from their wallet','Payment confirms on the XRP Ledger in 3-5 seconds'], tip:"Your client doesn't need a Netten account. Any crypto wallet works — even Coinbase." },
          { num:'05', color:'yellow', title:'Earn rewards automatically', href:'/dashboard/rewards', cta:'View Rewards', steps:['Every confirmed payment increments your Net Ten counter','Every 10 transactions, you automatically earn RLUSD','Rewards start at $0.25 and grow each quarter — up to $2.00','RLUSD deposits directly to your XRPL wallet','Withdraw anytime to your wallet or bank via Alchemy Pay'], tip:'Q1: $0.25 → Q2: $0.50 → Q3: $1.00 → Q4: $2.00 per milestone. Zero effort required.' },
        ].map((step, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-brand text-sm font-bold uppercase tracking-widest">Step {step.num}</span>
              <h2 className="text-white font-semibold text-lg">{step.title}</h2>
            </div>
            <ol className="space-y-2 mb-4">
              {step.steps.map((s, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-brand font-bold shrink-0">{j+1}.</span>{s}
                </li>
              ))}
            </ol>
            <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-brand-light text-xs">💡 {step.tip}</p>
            </div>
            {step.href && step.cta && (
              <Link href={step.href} className="btn-primary text-sm inline-flex">{step.cta} →</Link>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 card text-center py-8">
        <h3 className="text-white font-semibold text-lg mb-2">You're all set!</h3>
        <p className="text-gray-400 text-sm mb-4">Questions? netten.founders@gmail.com</p>
        <Link href="/dashboard" className="btn-primary text-sm">Go to Dashboard →</Link>
      </div>
    </div>
  )
}
