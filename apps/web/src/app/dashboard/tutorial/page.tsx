'use client'
import Link from 'next/link'

const sections = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      { q: 'How do I create my first pay link?', a: 'Go to Pay Links → Click "+ New Link" → Add a description and optional amount → Share the generated link with your client.' },
      { q: 'How do I set up my XRPL wallet?', a: 'In Settings, enter your XRPL wallet address (starts with "r"). This is where all your RLUSD payments will settle instantly.' },
      { q: 'What is RLUSD?', a: 'RLUSD is Ripple\'s regulated stablecoin pegged 1:1 to USD. It settles on the XRP Ledger in 3-5 seconds with near-zero fees.' },
    ]
  },
  {
    title: 'Pay Links',
    icon: '🔗',
    items: [
      { q: 'Fixed vs open amount?', a: 'Fixed amount locks the price (e.g., $50). Leave blank to let customers enter any amount — great for tips or donations.' },
      { q: 'How do I limit uses?', a: 'Set "Max uses" when creating a link. Once reached, the link deactivates automatically. Perfect for limited offers.' },
      { q: 'Can I set an expiration?', a: 'Yes! Set "Expires at" to auto-deactivate links after a date. Great for time-sensitive promotions.' },
    ]
  },
  {
    title: 'Invoices',
    icon: '📄',
    items: [
      { q: 'How do I create an invoice?', a: 'Go to Invoices → Click "+ New Invoice" → Add client email, line items, and due date → Send or share the link.' },
      { q: 'What happens when it\'s paid?', a: 'The invoice auto-updates to PAID status. You\'ll see it in your transaction history and the client gets a confirmation.' },
      { q: 'Can I add multiple line items?', a: 'Yes! Click "Add item" to add as many services/products as needed. Each can have its own description and price.' },
    ]
  },
  {
    title: 'Net Ten Rewards',
    icon: '⭐',
    items: [
      { q: 'What is Net Ten?', a: 'Every 10 transactions, NETTEN automatically deposits bonus RLUSD into your wallet. It\'s our way of rewarding active merchants.' },
      { q: 'How much do I earn?', a: 'Starting at $0.25 per Net Ten cycle. As you grow with NETTEN, your reward tier increases up to $2.00 per cycle.' },
      { q: 'When do rewards deposit?', a: 'Instantly! The moment your 10th transaction confirms, RLUSD hits your wallet within seconds.' },
    ]
  },
  {
    title: 'Audit Log',
    icon: '📋',
    items: [
      { q: 'What\'s in the Audit Log?', a: 'Every transaction, payment, and reward — timestamped and exportable. Perfect for taxes and accounting.' },
      { q: 'Can I export for my CPA?', a: 'Yes! Click "Export CSV" to download a spreadsheet-ready file with all transaction details.' },
      { q: 'How far back does it go?', a: 'Your complete history since signup. Nothing is ever deleted — full transparency.' },
    ]
  },
  {
    title: 'Security Best Practices',
    icon: '🔒',
    items: [
      { q: 'Is my wallet safe?', a: 'NETTEN is non-custodial. We never hold your funds — payments go directly to YOUR wallet. You control your keys.' },
      { q: 'Should I share my wallet seed?', a: 'NEVER share your wallet seed/secret with anyone, including NETTEN support. We will never ask for it.' },
      { q: 'How do I secure my account?', a: 'Use a strong email password and enable 2FA on your email. Your magic link login is only as secure as your email.' },
    ]
  },
]

export default function TutorialPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-semibold text-2xl">Best Practices</h1>
        <p className="text-gray-400 text-sm mt-1">Everything you need to know to get the most out of NETTEN</p>
      </div>

      <div className="space-y-8">
        {sections.map((section, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-border">
              <span className="text-2xl">{section.icon}</span>
              <h2 className="text-white font-semibold text-lg">{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.items.map((item, j) => (
                <div key={j}>
                  <p className="text-white font-medium text-sm mb-1">{item.q}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card bg-brand/10 border-brand/30">
        <div className="flex items-start gap-4">
          <span className="text-3xl">💬</span>
          <div>
            <h3 className="text-white font-semibold mb-1">Still have questions?</h3>
            <p className="text-gray-400 text-sm mb-3">We\'re here to help you succeed.</p>
            <a href="mailto:support@netten.app" className="btn-primary text-sm inline-block">Contact Support →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
