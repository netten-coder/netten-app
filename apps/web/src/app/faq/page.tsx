'use client'
import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

interface FAQCategory {
  label: string
  items: FAQItem[]
}

const FAQ_DATA: FAQCategory[] = [
  {
    label: 'Getting Started',
    items: [
      {
        q: 'What is Netten?',
        a: 'Netten is a non-custodial payment platform built on the XRP Ledger. It lets freelancers, creators, and businesses accept payment in any major cryptocurrency — or by credit card — and settle instantly in RLUSD (Ripple\'s regulated stablecoin). 1% flat fee. No holds. No frozen accounts.',
      },
      {
        q: 'Who is Netten for?',
        a: 'Netten is built for freelancers, digital creators, consultants, and small businesses who work with international clients. If you\'ve ever had PayPal freeze your account, Stripe hold your funds, or lost money to wire transfer fees, Netten was built for you.',
      },
      {
        q: 'Do I need to know anything about crypto to use Netten?',
        a: 'No. You\'ll need an XRPL wallet (we recommend Xaman — free and easy to set up), but you don\'t need to understand blockchain. Netten handles everything. Your clients don\'t need crypto at all — they can pay by credit card.',
      },
      {
        q: 'Is Netten live?',
        a: 'The product is built and validated. We are in the founding member stage — accepting the first 777 members at a locked rate of $44/mo before opening to the public at $59/mo.',
      },
    ],
  },
  {
    label: 'Payments & Settlement',
    items: [
      {
        q: 'What currencies can my clients pay in?',
        a: 'BTC, ETH, XRP, SOL, RLUSD, DOGE, BNB, USDC, ADA, TRX, XLM, HBAR, and more. Clients who don\'t have crypto can pay by Visa, Mastercard, or Apple Pay via MoonPay — you still receive RLUSD instantly.',
      },
      {
        q: 'What do I actually receive?',
        a: 'You receive RLUSD — Ripple\'s regulated stablecoin pegged 1:1 to the US dollar — directly into your XRPL wallet. No volatility. No conversion losses.',
      },
      {
        q: 'How fast does settlement happen?',
        a: '3–5 seconds. The XRP Ledger settles around the clock — no banking hours, no batch processing, no next-day transfers.',
      },
      {
        q: 'What is the fee?',
        a: '1% flat fee on every transaction. No monthly minimums. No hidden charges. No currency conversion fees. Just 1%.',
      },
      {
        q: 'Can my clients pay without having crypto?',
        a: 'Yes. Via MoonPay integration, clients can pay with their Visa, Mastercard, or Apple Pay. The payment is converted and you receive RLUSD in your wallet within seconds.',
      },
      {
        q: 'What countries does Netten support?',
        a: '160+ countries via MoonPay. PayPal and Stripe block or restrict 60+ countries. Netten doesn\'t restrict any of them.',
      },
    ],
  },
  {
    label: 'Security & Custody',
    items: [
      {
        q: 'Does Netten hold my funds?',
        a: 'Never. Netten is non-custodial — payments go directly from your client to your XRPL wallet. We are a payment rail, not a bank or escrow service. We have no ability to freeze, hold, or seize your funds.',
      },
      {
        q: 'What wallet do I need?',
        a: 'We recommend Xaman (formerly XUMM) — a free, non-custodial XRPL wallet available on iOS and Android. You can also use any XRPL-compatible wallet that supports RLUSD trust lines.',
      },
      {
        q: 'Is my wallet information safe?',
        a: 'Netten never has access to your private keys. Your wallet is controlled entirely by you. We only interact with your public wallet address to send payments and Net Ten rewards.',
      },
      {
        q: 'Has Netten been security audited?',
        a: 'Netten has rate limiting, transaction velocity protection, and security middleware deployed in production. A full third-party security audit is planned before the public launch.',
      },
    ],
  },
  {
    label: 'Net Ten Rewards',
    items: [
      {
        q: 'What is Net Ten?',
        a: 'Net Ten is Netten\'s built-in merchant loyalty engine. Every 10 confirmed payments you receive, RLUSD is automatically deposited into your wallet. No claims needed — it happens automatically.',
      },
      {
        q: 'How much do I earn?',
        a: 'Your reward rate grows as your business grows on Netten. Level 1 rewards are $0.25 RLUSD per milestone. Rates scale as you progress. Levels 3 and 4 are unlocked as you grow.',
      },
      {
        q: 'Do I need to do anything to receive Net Ten rewards?',
        a: 'Nothing. The counter increments automatically with every confirmed payment. When you hit 10, the RLUSD is sent directly to your wallet. No claims, no dashboards, no effort.',
      },
      {
        q: 'Does paying my subscription count toward Net Ten?',
        a: 'Yes. Subscription payments made via your XRPL wallet count toward your Net Ten milestone.',
      },
    ],
  },
  {
    label: 'Founding Membership',
    items: [
      {
        q: 'What is a founding member?',
        a: 'Founding members are the first 777 people to join Netten. You lock in $44/mo for life — the public price is $59/mo. Founding members also receive 3 months free at launch and Net Ten rewards from day one.',
      },
      {
        q: 'What happens after 777 spots are filled?',
        a: 'The founding rate closes permanently. New members pay $59/mo. There is no way to unlock the founding rate after the 777 spots are gone.',
      },
      {
        q: 'Is my $44/mo rate guaranteed forever?',
        a: 'Yes. Your founding rate is locked permanently and will never increase — regardless of what the public pricing does in the future.',
      },
      {
        q: 'What do I get for referring someone?',
        a: 'You and the person you refer each earn $10 RLUSD when they process their first payment through Netten. Your referral link is in your confirmation email after joining.',
      },
    ],
  },
  {
    label: 'Plans & Billing',
    items: [
      {
        q: 'What are the subscription tiers?',
        a: 'Founding: $44/mo (locked for 777 members). Pro: $59/mo (public). Studio: $99/mo (teams, coming soon).',
      },
      {
        q: 'Can I pay my subscription in RLUSD?',
        a: 'Yes — and we encourage it. Paying your subscription from your XRPL wallet counts toward your Net Ten milestone.',
      },
      {
        q: 'Can I pay by card?',
        a: 'Yes, via MoonPay.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Founding members receive 3 months free at launch. There is no ongoing free tier.',
      },
    ],
  },
  {
    label: 'Technical',
    items: [
      {
        q: 'What blockchain does Netten use?',
        a: 'The XRP Ledger (XRPL) — one of the fastest, lowest-cost, and most energy-efficient blockchains in the world.',
      },
      {
        q: 'What is RLUSD?',
        a: 'RLUSD is a regulated stablecoin issued by Ripple, pegged 1:1 to the US dollar. It runs natively on the XRP Ledger and can be withdrawn to your bank account via MoonPay.',
      },
      {
        q: 'How do I withdraw RLUSD to my bank account?',
        a: 'Via MoonPay\'s off-ramp — you can convert your RLUSD to fiat and transfer it to your bank account. MoonPay supports most major countries.',
      },
      {
        q: 'Do I need to install anything?',
        a: 'No. Netten is web-based. The only thing you need outside of Netten is an XRPL wallet (we recommend Xaman, free on iOS and Android).',
      },
    ],
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenIndex(prev => (prev === key ? null : key))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');
        :root{--e:#7CFF6B;--d:#041E17;--d2:#0A3D2E;--b:#1D9E75;--l:#9FE1CB;}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:var(--d);color:white;font-family:'Space Grotesk',sans-serif;min-height:100vh;overflow-x:hidden;}
        .gbg{position:fixed;inset:0;background-image:linear-gradient(rgba(29,158,117,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,158,117,.06) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0;}
        .orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;}
        .o1{width:600px;height:600px;background:radial-gradient(circle,rgba(124,255,107,.12) 0%,transparent 70%);top:-200px;right:-100px;animation:f1 8s ease-in-out infinite;}
        .o2{width:500px;height:500px;background:radial-gradient(circle,rgba(29,158,117,.15) 0%,transparent 70%);bottom:-100px;left:-100px;animation:f2 10s ease-in-out infinite;}
        @keyframes f1{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,40px)}}
        @keyframes f2{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
        .scan{position:fixed;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(124,255,107,.05),transparent);animation:scan 8s linear infinite;pointer-events:none;z-index:0;}
        @keyframes scan{0%{transform:translateY(-100vh)}100%{transform:translateY(100vh)}}
        .wrap{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:40px 5% 80px;}
        nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:64px;}
        .logo{display:flex;align-items:center;gap:10px;font-family:'Orbitron',monospace;font-weight:900;font-size:20px;letter-spacing:3px;color:var(--e);text-decoration:none;}
        .logo-icon{width:36px;height:36px;border:2px solid var(--e);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(124,255,107,.3);}
        .login-link{background:transparent;border:1px solid rgba(124,255,107,.3);color:var(--e);padding:10px 24px;border-radius:8px;font-family:'Space Grotesk',sans-serif;font-size:14px;cursor:pointer;transition:all .2s;text-decoration:none;}
        .login-link:hover{background:rgba(124,255,107,.1);}
        .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(124,255,107,.1);border:1px solid rgba(124,255,107,.3);color:var(--e);padding:8px 16px;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px;}
        .dot{width:6px;height:6px;background:var(--e);border-radius:50%;animation:pulse 2s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        h1{font-family:'Orbitron',monospace;font-size:clamp(36px,5.5vw,64px);font-weight:900;line-height:1.08;margin-bottom:20px;letter-spacing:-1px;}
        .sub{font-size:18px;color:var(--l);line-height:1.65;margin-bottom:48px;max-width:600px;}
        .sub a{color:var(--e);text-decoration:none;}
        .sub a:hover{text-decoration:underline;}
        .section-label{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:20px;}
        .divider{height:1px;background:rgba(255,255,255,.06);margin:40px 0;}
        .faq-category{margin-bottom:40px;}
        .faq-category-label{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--l);margin-bottom:16px;font-weight:600;}
        .faq-item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;margin-bottom:8px;overflow:hidden;transition:all .2s;}
        .faq-item.open{border-color:rgba(124,255,107,.2);background:rgba(124,255,107,.03);}
        .faq-q{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;cursor:pointer;gap:16px;transition:all .2s;}
        .faq-q:hover{background:rgba(255,255,255,.02);}
        .faq-q-text{font-size:16px;font-weight:500;line-height:1.4;}
        .faq-toggle{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(255,255,255,.4);flex-shrink:0;transition:all .2s;font-family:'Space Grotesk',sans-serif;line-height:1;}
        .faq-item.open .faq-toggle{background:rgba(124,255,107,.15);border-color:rgba(124,255,107,.3);color:var(--e);transform:rotate(45deg);}
        .faq-a{padding:0 24px 20px;font-size:15px;color:rgba(255,255,255,.55);line-height:1.7;}
        .cta-section{background:rgba(124,255,107,.04);border:1px solid rgba(124,255,107,.2);border-radius:20px;padding:40px;text-align:center;margin-bottom:24px;}
        .cta-heading{font-family:'Orbitron',monospace;font-size:clamp(22px,3vw,36px);font-weight:900;margin-bottom:14px;}
        .cta-body{font-size:15px;color:rgba(255,255,255,.55);line-height:1.65;margin-bottom:24px;max-width:500px;margin-left:auto;margin-right:auto;}
        .btn{display:inline-block;background:var(--e);color:var(--d);border:none;border-radius:12px;padding:16px 32px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;text-transform:uppercase;text-decoration:none;}
        .btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,255,107,.4);}
        footer{text-align:center;padding-top:40px;border-top:1px solid rgba(255,255,255,.06);}
        .footer-links{display:flex;gap:20px;justify-content:center;margin-bottom:12px;}
        .footer-links a{font-size:14px;color:rgba(255,255,255,.35);text-decoration:none;transition:color .2s;}
        .footer-links a:hover{color:var(--e);}
        .footer-copy{font-size:13px;color:rgba(255,255,255,.25);}
      `}</style>

      <div className="gbg"/>
      <div className="orb o1"/>
      <div className="orb o2"/>
      <div className="scan"/>

      <div className="wrap">
        {/* Nav */}
        <nav>
          <a href="/" className="logo">
            <div className="logo-icon"><span style={{fontSize:'16px',fontWeight:900}}>N</span></div>
            NETTEN
          </a>
          <a href="/auth/login" className="login-link">Merchant Login</a>
        </nav>

        {/* Hero */}
        <div className="badge"><div className="dot"/>FREQUENTLY ASKED QUESTIONS</div>
        <h1>Everything you need to know.</h1>
        <p className="sub">
          Can't find your answer? Email us at <a href="mailto:hello@netten.app">hello@netten.app</a>
        </p>

        {/* FAQ Sections */}
        {FAQ_DATA.map((category, ci) => (
          <div key={ci} className="faq-category">
            <div className="faq-category-label">{category.label}</div>
            {category.items.map((item, qi) => {
              const key = `${ci}-${qi}`
              const isOpen = openIndex === key
              return (
                <div key={key} className={`faq-item${isOpen ? ' open' : ''}`}>
                  <div className="faq-q" onClick={() => toggle(key)}>
                    <span className="faq-q-text">{item.q}</span>
                    <span className="faq-toggle">+</span>
                  </div>
                  {isOpen && <div className="faq-a">{item.a}</div>}
                </div>
              )
            })}
          </div>
        ))}

        {/* Still have questions CTA */}
        <div className="cta-section">
          <div className="cta-heading">Still have questions?</div>
          <div className="cta-body">
            Email us at hello@netten.app — we respond within 24 hours.
          </div>
          <a href="mailto:hello@netten.app" className="btn">Email Us →</a>
        </div>

        {/* Footer */}
        <div className="divider"/>
        <footer>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/faq">FAQ</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/auth/login">Merchant Login</a>
          </div>
          <div className="footer-copy">© 2026 Netten · Powered by XRP Ledger · netten.app</div>
        </footer>
      </div>
    </>
  )
}
