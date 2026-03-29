'use client'
import { useEffect, useState, useRef } from 'react'

const GOAL = 777

const COINS = [
  { symbol: 'BTC', color: '#F7931A', letter: '₿' },
  { symbol: 'ETH', color: '#627EEA', letter: 'Ξ' },
  { symbol: 'XRP', color: '#00AAE4', letter: 'X' },
  { symbol: 'SOL', color: '#9945FF', letter: '◎' },
  { symbol: 'RLUSD', color: '#7CFF6B', letter: 'R' },
  { symbol: 'DOGE', color: '#C2A633', letter: 'D' },
  { symbol: 'BNB', color: '#F3BA2F', letter: 'B' },
  { symbol: 'USDC', color: '#2775CA', letter: 'U' },
  { symbol: 'ADA', color: '#0033AD', letter: 'A' },
  { symbol: 'TRX', color: '#EF0027', letter: 'T' },
  { symbol: 'XLM', color: '#7B68EE', letter: 'S' },
  { symbol: 'HBAR', color: '#00B388', letter: 'H' },
]

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [myReferralCode, setMyReferralCode] = useState('')
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Always fetch live count from API
    fetch('/api/waitlist')
      .then(r => r.json())
      .then(d => { if (d.count) { setCount(d.count); localStorage.setItem('netten_waitlist_count', String(d.count)); }})
      .catch(() => {
        const stored = localStorage.getItem('netten_waitlist_count')
        if (stored) setCount(parseInt(stored))
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
        localStorage.setItem('netten_waitlist_count', String(newCount))
        localStorage.setItem('netten_my_referral', data.referralCode)
        setMyReferralCode(data.referralCode)
        setSubmitted(true)
      } else { setError(data.error || 'Something went wrong') }
    } catch {
      const newCount = count + 1
      const code = 'NET' + Math.random().toString(36).substring(2, 7).toUpperCase()
      setCount(newCount)
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

  const progress = Math.min((count / GOAL) * 100, 100)
  const spots = Math.max(GOAL - count, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');
        :root { --e:#7CFF6B;--d:#041E17;--d2:#0A3D2E;--b:#1D9E75;--l:#9FE1CB; }
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:var(--d);color:white;font-family:'Space Grotesk',sans-serif;min-height:100vh;overflow-x:hidden;}
        .gbg{position:fixed;inset:0;background-image:linear-gradient(rgba(29,158,117,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,158,117,.06) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0;}
        .orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;}
        .o1{width:600px;height:600px;background:radial-gradient(circle,rgba(124,255,107,.12) 0%,transparent 70%);top:-200px;right:-100px;animation:f1 8s ease-in-out infinite;}
        .o2{width:500px;height:500px;background:radial-gradient(circle,rgba(29,158,117,.15) 0%,transparent 70%);bottom:-100px;left:-100px;animation:f2 10s ease-in-out infinite;}
        @keyframes f1{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,40px)}}
        @keyframes f2{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:60px 24px 80px;}
        nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:80px;}
        .logo{display:flex;align-items:center;gap:10px;font-family:'Orbitron',monospace;font-weight:900;font-size:20px;letter-spacing:3px;color:var(--e);}
        .logo-icon{width:36px;height:36px;border:2px solid var(--e);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(124,255,107,.3);}
        .login-link{background:transparent;border:1px solid rgba(124,255,107,.3);color:var(--e);padding:8px 20px;border-radius:8px;font-family:'Space Grotesk',sans-serif;font-size:13px;cursor:pointer;transition:all .2s;text-decoration:none;}
        .login-link:hover{background:rgba(124,255,107,.1);}
        .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(124,255,107,.1);border:1px solid rgba(124,255,107,.3);color:var(--e);padding:6px 14px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px;}
        .dot{width:6px;height:6px;background:var(--e);border-radius:50%;animation:pulse 2s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        h1{font-family:'Orbitron',monospace;font-size:clamp(36px,7vw,56px);font-weight:900;line-height:1.05;margin-bottom:20px;letter-spacing:-1px;}
        .acc{color:var(--e);text-shadow:0 0 40px rgba(124,255,107,.4);}
        .sub{font-size:17px;color:var(--l);line-height:1.6;margin-bottom:48px;}
        .coins{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:48px;}
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
        .card-sub{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px;}
        .inputs{display:flex;flex-direction:column;gap:12px;margin-bottom:16px;}
        input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 16px;color:white;font-family:'Space Grotesk',sans-serif;font-size:15px;outline:none;transition:all .2s;width:100%;}
        input:focus{border-color:var(--e);background:rgba(124,255,107,.04);box-shadow:0 0 0 3px rgba(124,255,107,.08);}
        input::placeholder{color:rgba(255,255,255,.25);}
        .btn{width:100%;background:var(--e);color:var(--d);border:none;border-radius:12px;padding:16px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;text-transform:uppercase;}
        .btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,255,107,.4);}
        .btn:disabled{opacity:.6;cursor:not-allowed;}
        .err{color:#ff6b6b;font-size:13px;margin-top:8px;}
        .success{background:rgba(124,255,107,.06);border:1px solid rgba(124,255,107,.25);border-radius:20px;padding:32px;text-align:center;margin-bottom:24px;}
        .s-icon{width:56px;height:56px;background:rgba(124,255,107,.15);border:2px solid rgba(124,255,107,.4);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px;}
        .s-title{font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:var(--e);margin-bottom:8px;}
        .s-sub{color:var(--l);font-size:14px;margin-bottom:28px;line-height:1.6;}
        .ref-box{background:rgba(0,0,0,.3);border:1px solid rgba(124,255,107,.2);border-radius:12px;padding:16px;margin-bottom:16px;}
        .ref-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:8px;}
        .ref-url{font-family:'Orbitron',monospace;font-size:11px;color:var(--e);word-break:break-all;margin-bottom:12px;}
        .copy-btn{width:100%;background:transparent;border:1px solid rgba(124,255,107,.3);color:var(--e);border-radius:8px;padding:10px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
        .copy-btn:hover{background:rgba(124,255,107,.1);}
        .ref-note{font-size:12px;color:rgba(255,255,255,.4);line-height:1.5;}
        .ref-note strong{color:var(--e);}
        .features{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px;}
        @media(max-width:600px){.features{grid-template-columns:1fr;}}
        .feat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:20px;}
        .feat-icon{font-size:24px;margin-bottom:12px;}
        .feat-title{font-size:14px;font-weight:600;margin-bottom:6px;}
        .feat-desc{font-size:12px;color:rgba(255,255,255,.4);line-height:1.5;}
        .scan{position:fixed;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(124,255,107,.05),transparent);animation:scan 8s linear infinite;pointer-events:none;z-index:0;}
        @keyframes scan{0%{transform:translateY(-100vh)}100%{transform:translateY(100vh)}}
      `}</style>

      <div className="gbg"/>
      <div className="orb o1"/>
      <div className="orb o2"/>
      <div className="scan"/>

      <div className="wrap">
        <nav>
          <div className="logo">
            <div className="logo-icon"><span style={{fontSize:'16px',fontWeight:900}}>N</span></div>
            NETTEN
          </div>
          <a href="/auth/login" className="login-link">Merchant Login</a>
        </nav>

        <div className="badge"><div className="dot"/>Early Access — 777 Founding Spots</div>

        <h1>The Future of<br/><span className="acc">Crypto Payments</span><br/>is Here</h1>

        <p className="sub">Accept any cryptocurrency. Settle instantly in RLUSD on the XRP Ledger. Built for freelancers, creators, and businesses ready for the crypto age.</p>

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

        <div className="prog-section">
          <div className="prog-head">
            <span className="prog-label">Founding Members</span>
            <span className="prog-count">{count} / {GOAL}</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{width:`${Math.max(progress,0.5)}%`}}/>
          </div>
          <div className="prog-stats">
            <span>{progress.toFixed(1)}% filled</span>
            <span className="spots">{spots} spots remaining</span>
          </div>
        </div>

        {!submitted ? (
          <div className="card">
            <div className="card-title">Join the Waitlist</div>
            <div className="card-sub">Founding members lock in $44/mo forever — $15 less than the public price.</div>
            <form onSubmit={handleSubmit}>
              <div className="inputs">
                <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                <input type="text" placeholder="Referral code (optional)" value={referralCode} onChange={e=>setReferralCode(e.target.value)}/>
              </div>
              {error && <div className="err">{error}</div>}
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Securing your spot...' : 'Secure My Founding Spot →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="success">
            <div className="s-icon">✓</div>
            <div className="s-title">You're on the list!</div>
            <p className="s-sub">We'll notify you when Netten launches.<br/>Share your link to earn rewards when friends join.</p>
            <div className="ref-box">
              <div className="ref-label">Your Referral Link</div>
              <div className="ref-url">{typeof window!=='undefined'?`${window.location.origin}?ref=${myReferralCode}`:`netten.app?ref=${myReferralCode}`}</div>
              <button className="copy-btn" onClick={copyReferral}>{copied?'✓ Copied!':'Copy Referral Link'}</button>
            </div>
            <p className="ref-note"><strong>Earn rewards</strong> for every friend who joins using your link.<br/>Bonus details announced at launch. 🚀</p>
          </div>
        )}

        <div className="features">
          <div className="feat"><div className="feat-icon">⚡</div><div className="feat-title">Instant Settlement</div><div className="feat-desc">Payments settle in RLUSD on the XRP Ledger in seconds. No delays.</div></div>
          <div className="feat"><div className="feat-icon">🔒</div><div className="feat-title">Zero Custody</div><div className="feat-desc">Non-custodial. We never hold your funds. Your wallet, your money.</div></div>
          <div className="feat"><div className="feat-icon">🎁</div><div className="feat-title">Secret Rewards</div><div className="feat-desc">Every 10 transactions earns automatic RLUSD rewards deposited to your wallet.</div></div>
        </div>
      </div>
    </>
  )
}
