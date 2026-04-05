'use client'
import { useEffect, useState } from 'react'

const GOAL = 777

const COINS = [
  { symbol: 'BTC',   color: '#F7931A', letter: '₿' },
  { symbol: 'ETH',   color: '#627EEA', letter: 'Ξ' },
  { symbol: 'XRP',   color: '#00AAE4', letter: 'X' },
  { symbol: 'SOL',   color: '#9945FF', letter: '◎' },
  { symbol: 'RLUSD', color: '#7CFF6B', letter: 'R' },
  { symbol: 'DOGE',  color: '#C2A633', letter: 'D' },
  { symbol: 'BNB',   color: '#F3BA2F', letter: 'B' },
  { symbol: 'USDC',  color: '#2775CA', letter: 'U' },
  { symbol: 'ADA',   color: '#0033AD', letter: 'A' },
  { symbol: 'TRX',   color: '#EF0027', letter: 'T' },
  { symbol: 'XLM',   color: '#7B68EE', letter: 'S' },
  { symbol: 'HBAR',  color: '#00B388', letter: 'H' },
]

export default function WaitlistPage() {
  const [email, setEmail]               = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [submitted, setSubmitted]       = useState(false)
  const [myReferralCode, setMyReferralCode] = useState('')
  const [memberNumber, setMemberNumber] = useState<number | null>(null)
  const [count, setCount]               = useState(0)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [copied, setCopied]             = useState(false)
  const [progressWidth, setProgressWidth] = useState('0.5%')

  useEffect(() => {
    fetch('/api/waitlist')
      .then(r => r.json())
      .then(d => {
        if (d.count) {
          setCount(d.count)
          localStorage.setItem('netten_waitlist_count', String(d.count))
          // Fix: delay progress bar animation so DOM is painted first
          setTimeout(() => setProgressWidth(`${Math.max((d.count / GOAL) * 100, 0.5)}%`), 300)
        }
      })
      .catch(() => {
        const stored = localStorage.getItem('netten_waitlist_count')
        if (stored) {
          const n = parseInt(stored)
          setCount(n)
          setTimeout(() => setProgressWidth(`${Math.max((n / GOAL) * 100, 0.5)}%`), 300)
        }
      })
    const myCode = localStorage.getItem('netten_my_referral')
    if (myCode) { setMyReferralCode(myCode); setSubmitted(true) }
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferralCode(ref)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, referralCode }),
      })
      const data = await res.json()
      if (data.success) {
        const newCount = data.count || count + 1
        setCount(newCount)
        setMemberNumber(newCount)
        setTimeout(() => setProgressWidth(`${Math.max((newCount / GOAL) * 100, 0.5)}%`), 300)
        localStorage.setItem('netten_waitlist_count', String(newCount))
        localStorage.setItem('netten_my_referral', data.referralCode)
        setMyReferralCode(data.referralCode)
        setSubmitted(true)
      } else { setError(data.error || 'Something went wrong') }
    } catch {
      const newCount = count + 1
      const code = 'NET' + Math.random().toString(36).substring(2, 7).toUpperCase()
      setCount(newCount)
      setMemberNumber(newCount)
      setTimeout(() => setProgressWidth(`${Math.max((newCount / GOAL) * 100, 0.5)}%`), 300)
      localStorage.setItem('netten_waitlist_count', String(newCount))
      localStorage.setItem('netten_my_referral', code)
      setMyReferralCode(code)
      setSubmitted(true)
    } finally { setLoading(false) }
  }

  function copyReferral() {
    const url = `${window.location.origin}?ref=${myReferralCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const spots = Math.max(GOAL - count, 0)

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
        .wrap{position:relative;z-index:1;max-width:920px;margin:0 auto;padding:48px 32px 80px;}
        nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:64px;}
        .logo{display:flex;align-items:center;gap:10px;font-family:'Orbitron',monospace;font-weight:900;font-size:20px;letter-spacing:3px;color:var(--e);}
        .logo-icon{width:36px;height:36px;border:2px solid var(--e);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(124,255,107,.3);}
        .login-link{background:transparent;border:1px solid rgba(124,255,107,.3);color:var(--e);padding:8px 20px;border-radius:8px;font-family:'Space Grotesk',sans-serif;font-size:13px;cursor:pointer;transition:all .2s;text-decoration:none;}
        .login-link:hover{background:rgba(124,255,107,.1);}
        .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(124,255,107,.1);border:1px solid rgba(124,255,107,.3);color:var(--e);padding:6px 14px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px;}
        .dot{width:6px;height:6px;background:var(--e);border-radius:50%;animation:pulse 2s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        h1{font-family:'Orbitron',monospace;font-size:clamp(36px,5.5vw,64px);font-weight:900;line-height:1.08;margin-bottom:20px;letter-spacing:-1px;}
        .acc{color:var(--e);text-shadow:0 0 40px rgba(124,255,107,.4);}
        .sub{font-size:18px;color:var(--l);line-height:1.65;margin-bottom:32px;}
        .pain-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:40px;}
        @media(max-width:540px){.pain-stats{grid-template-columns:1fr;}}
        .pain-stat{background:rgba(255,100,100,.06);border:1px solid rgba(255,100,100,.15);border-radius:12px;padding:22px 18px;text-align:center;}
        .pain-num{font-family:'Orbitron',monospace;font-size:28px;font-weight:900;color:#ff7c7c;margin-bottom:6px;}
        .pain-label{font-size:11px;color:rgba(255,255,255,.45);line-height:1.4;}
        .coins{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:40px;}
        .cpill{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:100px;padding:6px 12px 6px 6px;transition:all .2s;}
        .cpill:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}
        .cicon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
        .csym{font-size:12px;font-weight:600;color:rgba(255,255,255,.7);font-family:'Orbitron',monospace;letter-spacing:.5px;}
        .prog-section{background:rgba(255,255,255,.03);border:1px solid rgba(124,255,107,.15);border-radius:16px;padding:24px;margin-bottom:32px;}
        .prog-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
        .prog-label{font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--l);}
        .prog-count{font-family:'Orbitron',monospace;font-size:13px;color:var(--e);font-weight:700;}
        .prog-track{height:8px;background:rgba(255,255,255,.06);border-radius:100px;overflow:visible;margin-bottom:12px;position:relative;}
        .prog-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,var(--b),var(--e));transition:width 1s cubic-bezier(.4,0,.2,1);box-shadow:0 0 20px rgba(124,255,107,.4);position:relative;}
        .prog-fill::after{content:'';position:absolute;right:-4px;top:50%;transform:translateY(-50%);width:14px;height:14px;background:var(--e);border-radius:50%;box-shadow:0 0 12px var(--e);border:2px solid var(--d);}
        .prog-stats{display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.4);}
        .spots{color:var(--e);font-weight:600;}
        .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px;margin-bottom:24px;}
        .card-title{font-size:18px;font-weight:600;margin-bottom:6px;}
        .card-sub{font-size:15px;color:rgba(255,255,255,.45);margin-bottom:24px;line-height:1.6;}
        .inputs{display:flex;flex-direction:column;gap:12px;margin-bottom:16px;}
        input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 16px;color:white;font-family:'Space Grotesk',sans-serif;font-size:15px;outline:none;transition:all .2s;width:100%;}
        input:focus{border-color:var(--e);background:rgba(124,255,107,.04);box-shadow:0 0 0 3px rgba(124,255,107,.08);}
        input::placeholder{color:rgba(255,255,255,.25);}
        .btn{width:100%;background:var(--e);color:var(--d);border:none;border-radius:12px;padding:16px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;text-transform:uppercase;}
        .btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,255,107,.4);}
        .btn:disabled{opacity:.6;cursor:not-allowed;}
        .err{color:#ff6b6b;font-size:13px;margin-top:8px;}
        .success{background:rgba(124,255,107,.06);border:1px solid rgba(124,255,107,.25);border-radius:20px;padding:32px;text-align:center;margin-bottom:24px;}
        .s-icon{width:56px;height:56px;background:rgba(124,255,107,.15);border:2px solid rgba(124,255,107,.4);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;}
        .s-member{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px;}
        .s-title{font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:var(--e);margin-bottom:8px;}
        .s-sub{color:var(--l);font-size:14px;margin-bottom:12px;line-height:1.6;}
        .s-perks{background:rgba(0,0,0,.2);border-radius:12px;padding:14px 16px;margin-bottom:20px;text-align:left;}
        .s-perk{font-size:12px;color:rgba(255,255,255,.55);padding:3px 0;display:flex;align-items:center;gap:8px;}
        .s-perk-check{color:var(--e);font-size:14px;flex-shrink:0;}
        .ref-box{background:rgba(0,0,0,.3);border:1px solid rgba(124,255,107,.2);border-radius:12px;padding:16px;margin-bottom:16px;}
        .ref-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:8px;}
        .ref-url{font-family:'Orbitron',monospace;font-size:11px;color:var(--e);word-break:break-all;margin-bottom:12px;}
        .copy-btn{width:100%;background:transparent;border:1px solid rgba(124,255,107,.3);color:var(--e);border-radius:8px;padding:10px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
        .copy-btn:hover{background:rgba(124,255,107,.1);}
        .ref-note{font-size:14px;color:rgba(255,255,255,.45);line-height:1.6;}
        .ref-note strong{color:var(--e);}
        .net-ten{background:rgba(124,255,107,.04);border:1px solid rgba(124,255,107,.2);border-radius:20px;padding:28px;margin-bottom:24px;}
        .nt-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(124,255,107,.12);border:1px solid rgba(124,255,107,.3);color:var(--e);padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;}
        .nt-title{font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:white;margin-bottom:8px;}
        .nt-sub{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:20px;line-height:1.5;}
        .nt-dots{display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
        .ndot{width:32px;height:32px;border-radius:50%;border:2px solid rgba(124,255,107,.3);display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:11px;color:rgba(255,255,255,.3);transition:all .3s;}
        .ndot.active{background:var(--e);color:var(--d);border-color:var(--e);box-shadow:0 0 14px rgba(124,255,107,.5);font-weight:700;}
        .ndot.filled{background:rgba(124,255,107,.15);color:var(--e);border-color:rgba(124,255,107,.4);}
        .nt-arrow{color:rgba(255,255,255,.2);font-size:12px;}
        .nt-reward{background:rgba(0,0,0,.3);border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;}
        .nt-reward-label{font-size:12px;color:rgba(255,255,255,.5);}
        .nt-reward-amount{font-family:'Orbitron',monospace;font-size:18px;font-weight:700;color:var(--e);}
        .nt-tiers{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px;}
        .nt-tier{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px;text-align:center;}
        .nt-tier.current{border-color:rgba(124,255,107,.3);background:rgba(124,255,107,.06);}
        .nt-tier-label{font-size:10px;color:rgba(255,255,255,.3);margin-bottom:4px;letter-spacing:1px;text-transform:uppercase;}
        .nt-tier-amt{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:var(--e);}
        .nt-tier.locked .nt-tier-amt{color:rgba(255,255,255,.2);}
        .social-proof{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;align-items:center;}
        .sp-label{font-size:12px;color:rgba(255,255,255,.35);letter-spacing:1px;text-transform:uppercase;width:100%;margin-bottom:6px;}
        .sp-chip{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:100px;padding:7px 14px;font-size:13px;color:rgba(255,255,255,.55);}
        .sp-dot{width:5px;height:5px;background:var(--e);border-radius:50%;}
        .moonpay-row{display:flex;align-items:center;gap:10px;background:rgba(100,150,255,.06);border:1px solid rgba(100,150,255,.15);border-radius:12px;padding:14px 16px;margin-bottom:24px;}
        .mp-icon{width:32px;height:32px;background:rgba(100,150,255,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
        .mp-text{font-size:15px;color:rgba(255,255,255,.65);line-height:1.5;}
        .mp-text strong{color:white;}
        .features{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px;}
        @media(max-width:600px){.features{grid-template-columns:1fr;}}
        .feat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:20px;}
        .feat-icon{font-size:24px;margin-bottom:12px;}
        .feat-title{font-size:16px;font-weight:600;margin-bottom:8px;}
        .feat-desc{font-size:14px;color:rgba(255,255,255,.45);line-height:1.6;}
        .divider{height:1px;background:rgba(255,255,255,.06);margin:40px 0;}
        .how-it-works{margin-bottom:40px;}
        .section-label{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:20px;}
        .hiw-steps{display:grid;gap:12px;}
        .hiw-step{display:flex;align-items:flex-start;gap:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:16px;}
        .hiw-num{width:28px;height:28px;border-radius:50%;background:rgba(124,255,107,.12);border:1px solid rgba(124,255,107,.3);display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:11px;font-weight:700;color:var(--e);flex-shrink:0;}
        .hiw-content h3{font-size:16px;font-weight:600;margin-bottom:4px;}
        .hiw-content p{font-size:14px;color:rgba(255,255,255,.45);line-height:1.6;}
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
          <div className="logo">
            <div className="logo-icon"><span style={{fontSize:'16px',fontWeight:900}}>N</span></div>
            NETTEN
          </div>
          <a href="/auth/login" className="login-link">Merchant Login</a>
        </nav>

        {/* Badge */}
        <div className="badge"><div className="dot"/>Early Access — 777 Founding Spots</div>

        {/* Headline — pain first */}
        <h1>PayPal blocks 60 countries.<br/>Stripe holds your money.<br/><span className="acc">Netten doesn't.</span></h1>

        <p className="sub">
          Accept any crypto from any client, anywhere. Settle instantly in RLUSD on the XRP Ledger.
          1% flat fee. Non-custodial. Your money, your wallet — always.
        </p>

        {/* Pain stats */}
        <div className="pain-stats">
          <div className="pain-stat">
            <div className="pain-num">60+</div>
            <div className="pain-label">countries PayPal & Stripe block or restrict</div>
          </div>
          <div className="pain-stat">
            <div className="pain-num">8–15%</div>
            <div className="pain-label">lost to wire fees, conversion, and holds</div>
          </div>
          <div className="pain-stat">
            <div className="pain-num">180</div>
            <div className="pain-label">days PayPal can hold your funds</div>
          </div>
        </div>

        {/* Coin pills */}
        <div className="coins">
          {COINS.map(c => (
            <div key={c.symbol} className="cpill">
              <div className="cicon" style={{background:c.color+'22',border:`1px solid ${c.color}44`}}>
                <span style={{color:c.color}}>{c.letter}</span>
              </div>
              <span className="csym">{c.symbol}</span>
            </div>
          ))}
          <div className="cpill">
            <div className="cicon" style={{background:'rgba(255,255,255,.05)'}}>
              <span style={{color:'rgba(255,255,255,.4)',fontSize:'14px'}}>+</span>
            </div>
            <span className="csym" style={{color:'rgba(255,255,255,.4)'}}>MORE</span>
          </div>
        </div>

        {/* MoonPay card payment callout */}
        <div className="moonpay-row">
          <div className="mp-icon">💳</div>
          <div className="mp-text">
            <strong>Your clients don't need crypto.</strong> They can pay by Visa, Mastercard, or Apple Pay via MoonPay — you still receive RLUSD instantly.
          </div>
        </div>

        {/* Progress bar */}
        <div className="prog-section">
          <div className="prog-head">
            <span className="prog-label">Founding Members</span>
            <span className="prog-count">{count} / {GOAL}</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{width: progressWidth}}/>
          </div>
          <div className="prog-stats">
            <span>{((count / GOAL) * 100).toFixed(1)}% filled</span>
            <span className="spots">{spots} spots remaining</span>
          </div>
        </div>

        {/* Form / Success */}
        {!submitted ? (
          <div className="card">
            <div className="card-title">Secure Your Founding Spot</div>
            <div className="card-sub">
              Founding members lock in <strong style={{color:'white'}}>$44/mo forever</strong> — $15 less than the public price. 3 months free at launch. 777 spots total.
            </div>
            <form onSubmit={handleSubmit}>
              <div className="inputs">
                <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                <input type="text" placeholder="Referral code (optional)" value={referralCode} onChange={e=>setReferralCode(e.target.value)}/>
              </div>
              {error && <div className="err">{error}</div>}
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Securing your spot...' : `Claim Founding Spot →`}
              </button>
            </form>
          </div>
        ) : (
          <div className="success">
            <div className="s-icon">✓</div>
            {memberNumber && <div className="s-member">Founding Member #{memberNumber} of 777</div>}
            <div className="s-title">You're in!</div>
            <p className="s-sub">Welcome to the founding class of Netten.</p>
            <div className="s-perks">
              <div className="s-perk"><span className="s-perk-check">✓</span>$44/mo locked forever — never increases</div>
              <div className="s-perk"><span className="s-perk-check">✓</span>3 months free when we launch</div>
              <div className="s-perk"><span className="s-perk-check">✓</span>Net Ten rewards active from day one</div>
              <div className="s-perk"><span className="s-perk-check">✓</span>Direct line to the founding team</div>
            </div>
            <div className="ref-box">
              <div className="ref-label">Your Referral Link</div>
              <div className="ref-url">{typeof window!=='undefined'?`${window.location.origin}?ref=${myReferralCode}`:`netten.app?ref=${myReferralCode}`}</div>
              <button className="copy-btn" onClick={copyReferral}>{copied?'✓ Copied!':'Copy Referral Link'}</button>
            </div>
            <p className="ref-note"><strong>Every founding member you refer earns you 1 extra month free.</strong><br/>Share while the excitement is fresh — 777 spots total.</p>
          </div>
        )}

        {/* Social proof */}
        <div className="social-proof">
          <div className="sp-label">Built for the XRPL ecosystem</div>
          <div className="sp-chip"><div className="sp-dot"/>XRP Ledger</div>
          <div className="sp-chip"><div className="sp-dot"/>RLUSD by Ripple</div>
          <div className="sp-chip"><div className="sp-dot"/>Xaman Wallet</div>
          <div className="sp-chip"><div className="sp-dot"/>MoonPay</div>
          <div className="sp-chip"><div className="sp-dot"/>XRPL Developer Community</div>
        </div>

        <div className="divider"/>

        {/* Net Ten section — fully revealed */}
        <div className="net-ten">
          <div className="nt-badge">⚡ Net Ten Effect</div>
          <div className="nt-title">Every 10 transactions. Automatic RLUSD.</div>
          <div className="nt-sub">
            Net Ten is Netten's built-in merchant loyalty engine. Every 10 confirmed payments, RLUSD is deposited directly into your wallet — automatically, no claims required. Your rate grows as your business grows.
          </div>
          <div className="nt-dots">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <div key={n} className={`ndot filled`}>{n}</div>
            ))}
            <div className="nt-arrow">→</div>
            <div className="ndot active">10</div>
          </div>
          <div className="nt-reward">
            <div>
              <div className="nt-reward-label">Reward at milestone 10</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,.3)',marginTop:'2px'}}>Grows with your tenure on Netten</div>
            </div>
            <div className="nt-reward-amount">$0.25 RLUSD</div>
          </div>
          <div className="nt-tiers">
            <div className="nt-tier current">
              <div className="nt-tier-label">Level 1</div>
              <div className="nt-tier-amt">$0.25</div>
            </div>
            <div className="nt-tier">
              <div className="nt-tier-label">Level 2</div>
              <div className="nt-tier-amt">$0.50</div>
            </div>
            <div className="nt-tier locked">
              <div className="nt-tier-label">Level 3</div>
              <div className="nt-tier-amt">$1.00</div>
            </div>
            <div className="nt-tier locked">
              <div className="nt-tier-label">Level 4</div>
              <div className="nt-tier-amt">$2.00</div>
            </div>
          </div>
        </div>

        <div className="divider"/>

        {/* How it works */}
        <div className="how-it-works">
          <div className="section-label">How it works</div>
          <div className="hiw-steps">
            <div className="hiw-step">
              <div className="hiw-num">1</div>
              <div className="hiw-content">
                <h3>Create a pay link in seconds</h3>
                <p>Enter an amount and description. Your shareable link is ready instantly — no integration required.</p>
              </div>
            </div>
            <div className="hiw-step">
              <div className="hiw-num">2</div>
              <div className="hiw-content">
                <h3>Client pays in any crypto — or by card</h3>
                <p>They scan the QR code and pay in BTC, ETH, SOL, XRP, or RLUSD. No crypto? They pay by Visa or Mastercard via MoonPay.</p>
              </div>
            </div>
            <div className="hiw-step">
              <div className="hiw-num">3</div>
              <div className="hiw-content">
                <h3>You receive RLUSD in 3–5 seconds</h3>
                <p>Settlement happens directly on the XRP Ledger. No intermediaries. No holds. 1% flat fee — that's it.</p>
              </div>
            </div>
            <div className="hiw-step">
              <div className="hiw-num">4</div>
              <div className="hiw-content">
                <h3>Net Ten rewards land automatically</h3>
                <p>Every 10 payments, RLUSD drops into your wallet. Withdraw to your bank anytime via MoonPay. Zero effort.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="features">
          <div className="feat">
            <div className="feat-icon">⚡</div>
            <div className="feat-title">3-Second Settlement</div>
            <div className="feat-desc">Payments confirm on the XRP Ledger in seconds. No batch processing, no next-day transfers.</div>
          </div>
          <div className="feat">
            <div className="feat-icon">🔒</div>
            <div className="feat-title">Non-Custodial</div>
            <div className="feat-desc">We never hold your funds. Your XRPL wallet, your keys, your money — always.</div>
          </div>
          <div className="feat">
            <div className="feat-icon">💳</div>
            <div className="feat-title">Card Payments</div>
            <div className="feat-desc">Clients without crypto pay by Visa, Mastercard, or Apple Pay. You still receive RLUSD.</div>
          </div>
        </div>

        {/* Footer */}
        <div className="divider"/>
        <footer>
          <div className="footer-links">
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
