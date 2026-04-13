'use client'
import Link from 'next/link'

export default function GuidePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl mb-1">Getting Started</h1>
        <p className="text-gray-400 text-sm">Everything you need to start accepting crypto payments in minutes</p>
      </div>

      {/* Quick Start Checklist */}
      <div className="card mb-8 bg-brand/5 border-brand/20">
        <h2 className="text-white font-semibold mb-3">⚡ Quick Start Checklist</h2>
        <div className="grid md:grid-cols-2 gap-2">
          {[
            { label: 'Connect XRPL wallet', href: '/dashboard/settings' },
            { label: 'Create first pay link', href: '/dashboard/links' },
            { label: 'Send first invoice', href: '/dashboard/invoices' },
            { label: 'Review rewards progress', href: '/dashboard/rewards' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand-light transition-colors p-2 rounded-lg hover:bg-brand/10">
              <span className="w-5 h-5 rounded border border-brand/40 flex items-center justify-center text-xs text-brand">✓</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Wallet Setup */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Step 01</span>
            <h2 className="text-white font-semibold text-lg">Connect your XRPL wallet</h2>
          </div>
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">1.</span>Go to Settings in the left sidebar</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">2.</span>Under XRPL Settlement Wallet, paste your XRP Ledger address (starts with "r")</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">3.</span>Click Save — all payments now settle as RLUSD to this address</li>
          </ol>
          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-brand-light text-xs">💡 Need a wallet? Download <a href="https://xaman.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Xaman</a> — free and takes 2 minutes. Your wallet address is in Profile → Account.</p>
          </div>
          <Link href="/dashboard/settings" className="btn-primary text-sm inline-flex">Go to Settings →</Link>
        </div>

        {/* Step 2: Pay Links */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Step 02</span>
            <h2 className="text-white font-semibold text-lg">Create a Pay Link</h2>
          </div>
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">1.</span>Click Pay Links in the sidebar</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">2.</span>Click + New Link</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">3.</span>Enter a description (e.g., "Logo Design Project")</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">4.</span>Enter amount in USD, or leave blank for open amount</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">5.</span>Optional: Set max uses or expiration date</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">6.</span>Click Create Link — copy and send to your client</li>
          </ol>
          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-brand-light text-xs">💡 Open-amount links let clients pay any amount — perfect for tips, donations, or "pay what you can" services.</p>
          </div>
          <Link href="/dashboard/links" className="btn-primary text-sm inline-flex">Create a Pay Link →</Link>
        </div>

        {/* Step 3: Invoices */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Step 03</span>
            <h2 className="text-white font-semibold text-lg">Send a crypto invoice</h2>
          </div>
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">1.</span>Click Invoices in the sidebar</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">2.</span>Click + New Invoice</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">3.</span>Fill in client name, email, and line items</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">4.</span>Set due date (optional)</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">5.</span>Watch the live preview as you type</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">6.</span>Click Create & Send — client gets a payment link via email</li>
          </ol>
          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-brand-light text-xs">💡 When your client pays, the invoice automatically marks PAID — no manual updates needed.</p>
          </div>
          <Link href="/dashboard/invoices" className="btn-primary text-sm inline-flex">Create an Invoice →</Link>
        </div>

        {/* Step 4: How Payments Work */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Step 04</span>
            <h2 className="text-white font-semibold text-lg">How your client pays</h2>
          </div>
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">1.</span>Client opens your pay link on any device</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">2.</span>They choose their crypto: RLUSD, XRP, BTC, ETH, or SOL</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">3.</span>Or they pay with card via MoonPay (no crypto needed)</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">4.</span>Payment confirms on XRPL in 3-5 seconds</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">5.</span>RLUSD settles directly to your wallet — you see it instantly</li>
          </ol>
          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3">
            <p className="text-brand-light text-xs">💡 Your client does NOT need a NETTEN account. Any crypto wallet works — Xaman, Coinbase, MetaMask, Trust Wallet, etc.</p>
          </div>
        </div>

        {/* Step 5: Net Ten Rewards */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Step 05</span>
            <h2 className="text-white font-semibold text-lg">Earn Net Ten rewards</h2>
          </div>
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">1.</span>Every payment increments your Net Ten counter</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">2.</span>Every 10 transactions = automatic RLUSD reward</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">3.</span>Rewards grow as you stay active with NETTEN</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">4.</span>RLUSD deposits directly to your wallet — no action needed</li>
          </ol>
          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-brand-light text-xs">💡 Reward tiers: Level 1 = $0.25 → Level 2 = $0.50 → Level 3 = $1.00 → Level 4 = $2.00. The longer you stay, the more you earn.</p>
          </div>
          <Link href="/dashboard/rewards" className="btn-primary text-sm inline-flex">View Rewards →</Link>
        </div>

        {/* Step 6: Ambassador Program */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Step 06</span>
            <h2 className="text-white font-semibold text-lg">Refer friends, earn credits</h2>
          </div>
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">1.</span>Go to Ambassadors in the sidebar</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">2.</span>Copy your unique referral link</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">3.</span>Share with friends and fellow freelancers</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">4.</span>Earn subscription credits for each signup</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">5.</span>Climb the leaderboard and unlock higher tiers</li>
          </ol>
          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-brand-light text-xs">💡 Ambassador tiers: Bronze (3+), Silver (10+), Gold (25+), Platinum (50+), Diamond (100+). Each tier unlocks more credits per referral.</p>
          </div>
          <Link href="/dashboard/referrals" className="btn-primary text-sm inline-flex">View Ambassador Program →</Link>
        </div>

        {/* Step 7: Audit & Taxes */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Step 07</span>
            <h2 className="text-white font-semibold text-lg">Track payments for taxes</h2>
          </div>
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">1.</span>Go to Audit Log in the sidebar</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">2.</span>View every transaction with timestamps and amounts</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">3.</span>Click Export CSV for a spreadsheet-ready file</li>
            <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-brand font-bold shrink-0">4.</span>Send to your accountant or import into QuickBooks</li>
          </ol>
          <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-brand-light text-xs">💡 NETTEN keeps your complete transaction history forever. Export anytime for quarterly or annual tax filings.</p>
          </div>
          <Link href="/dashboard/audit" className="btn-primary text-sm inline-flex">View Audit Log →</Link>
        </div>
      </div>

      {/* Support */}
      <div className="mt-8 card text-center py-8">
        <h3 className="text-white font-semibold text-lg mb-2">You are all set! 🎉</h3>
        <p className="text-gray-400 text-sm mb-4">Questions? Check Best Practices or reach out anytime.</p>
        <div className="flex justify-center gap-3">
          <Link href="/dashboard/tutorial" className="btn-secondary text-sm">Best Practices</Link>
          <a href="mailto:support@netten.app" className="btn-primary text-sm">Contact Support →</a>
        </div>
      </div>
    </div>
  )
}
