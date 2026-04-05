'use client'

export default function AboutPage() {
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
        .wrap{position:relative;z-index:1;max-width:800px;margin:0 auto;padding:40px 5% 80px;}
        nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:64px;}
        .logo{display:flex;align-items:center;gap:10px;font-family:'Orbitron',monospace;font-weight:900;font-size:20px;letter-spacing:3px;color:var(--e);text-decoration:none;}
        .logo-icon{width:36px;height:36px;border:2px solid var(--e);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(124,255,107,.3);}
        .back-link{background:transparent;border:1px solid rgba(124,255,107,.3);color:var(--e);padding:10px 24px;border-radius:8px;font-family:'Space Grotesk',sans-serif;font-size:14px;cursor:pointer;transition:all .2s;text-decoration:none;}
        .back-link:hover{background:rgba(124,255,107,.1);}
        
        .hero{display:grid;grid-template-columns:280px 1fr;gap:48px;margin-bottom:48px;align-items:start;}
        @media(max-width:700px){.hero{grid-template-columns:1fr;text-align:center;}}
        
        .photo-container{position:relative;}
        .photo{width:100%;aspect-ratio:1;object-fit:cover;border-radius:20px;border:2px solid rgba(124,255,107,.3);box-shadow:0 0 40px rgba(124,255,107,.15);filter:grayscale(100%);}
        .photo-glow{position:absolute;inset:-2px;border-radius:22px;background:linear-gradient(135deg,rgba(124,255,107,.3),transparent 50%);z-index:-1;}
        
        .intro h1{font-family:'Orbitron',monospace;font-size:36px;font-weight:900;line-height:1.2;margin-bottom:12px;}
        .intro h1 span{color:var(--e);text-shadow:0 0 30px rgba(124,255,107,.4);}
        .intro .role{font-size:16px;color:var(--l);margin-bottom:20px;letter-spacing:1px;}
        .intro .tagline{font-size:18px;color:rgba(255,255,255,.7);line-height:1.7;}
        
        .socials{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap;}
        @media(max-width:700px){.socials{justify-content:center;}}
        .social-link{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:100px;padding:10px 18px;font-size:14px;color:rgba(255,255,255,.6);text-decoration:none;transition:all .2s;}
        .social-link:hover{background:rgba(124,255,107,.08);border-color:rgba(124,255,107,.3);color:white;transform:translateY(-2px);}
        .social-icon{font-size:16px;}
        
        .divider{height:1px;background:rgba(255,255,255,.06);margin:48px 0;}
        
        .section{margin-bottom:48px;}
        .section-label{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:16px;}
        .section h2{font-family:'Orbitron',monospace;font-size:24px;font-weight:700;color:white;margin-bottom:16px;}
        .section p{font-size:16px;color:rgba(255,255,255,.6);line-height:1.8;margin-bottom:16px;}
        .section p strong{color:white;}
        .section p .accent{color:var(--e);}
        
        .values{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px;}
        @media(max-width:600px){.values{grid-template-columns:1fr;}}
        .value{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px;text-align:center;}
        .value-icon{font-size:28px;margin-bottom:12px;}
        .value-title{font-size:15px;font-weight:600;margin-bottom:6px;}
        .value-desc{font-size:13px;color:rgba(255,255,255,.45);line-height:1.5;}
        
        .timeline{display:flex;flex-direction:column;gap:16px;}
        .timeline-item{display:flex;gap:16px;align-items:flex-start;}
        .timeline-dot{width:12px;height:12px;border-radius:50%;background:var(--e);margin-top:6px;flex-shrink:0;box-shadow:0 0 12px rgba(124,255,107,.5);}
        .timeline-content h3{font-size:15px;font-weight:600;margin-bottom:4px;}
        .timeline-content p{font-size:14px;color:rgba(255,255,255,.5);line-height:1.6;}
        
        .cta-box{background:rgba(124,255,107,.06);border:1px solid rgba(124,255,107,.25);border-radius:20px;padding:32px;text-align:center;margin-top:48px;}
        .cta-title{font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:white;margin-bottom:8px;}
        .cta-sub{font-size:15px;color:rgba(255,255,255,.55);margin-bottom:20px;line-height:1.6;}
        .cta-btn{display:inline-block;background:var(--e);color:var(--d);border:none;border-radius:12px;padding:14px 32px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;text-transform:uppercase;text-decoration:none;}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,255,107,.4);}
        
        footer{text-align:center;padding-top:40px;border-top:1px solid rgba(255,255,255,.06);}
        .footer-links{display:flex;gap:20px;justify-content:center;margin-bottom:12px;flex-wrap:wrap;}
        .footer-links a{font-size:14px;color:rgba(255,255,255,.35);text-decoration:none;transition:color .2s;}
        .footer-links a:hover{color:var(--e);}
        .footer-copy{font-size:13px;color:rgba(255,255,255,.25);}
      `}</style>

      <div className="gbg"/>
      <div className="orb o1"/>
      <div className="orb o2"/>

      <div className="wrap">
        {/* Nav */}
        <nav>
          <a href="/" className="logo">
            <div className="logo-icon"><span style={{fontSize:'16px',fontWeight:900}}>N</span></div>
            NETTEN
          </a>
          <a href="/" className="back-link">← Back to Home</a>
        </nav>

        {/* Hero */}
        <div className="hero">
          <div className="photo-container">
            <div className="photo-glow"/>
            <img 
              src="/jermaine.jpg" 
              alt="Jermaine Ulinwa, Founder of Netten" 
              className="photo"
            />
          </div>
          <div className="intro">
            <h1>Hey, I'm <span>Jermaine</span></h1>
            <div className="role">Founder & Builder @ Netten</div>
            <p className="tagline">
              I'm building the payment infrastructure I wish existed when I was a freelancer getting blocked, 
              held up, and charged 10% just to get paid.
            </p>
            <div className="socials">
              <a href="https://twitter.com/jermaineulinwa" target="_blank" rel="noopener noreferrer" className="social-link">
                <span className="social-icon">𝕏</span>
                Twitter
              </a>
              <a href="mailto:jermaine@netten.app" className="social-link">
                <span className="social-icon">✉</span>
                Email
              </a>
              <a href="https://github.com/netten-coder" target="_blank" rel="noopener noreferrer" className="social-link">
                <span className="social-icon">⌘</span>
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="divider"/>

        {/* Story */}
        <div className="section">
          <div className="section-label">The Story</div>
          <h2>Why I Built Netten</h2>
          <p>
            I've been a freelancer, a consultant, and a builder working with clients across the world. 
            And I've experienced every pain point in global payments firsthand.
          </p>
          <p>
            <strong>PayPal blocked my account</strong> because my client was in a "restricted" country. 
            <strong>Stripe held my funds</strong> for 30 days for "risk review." Wire transfers ate 
            <strong className="accent"> 8-15%</strong> of my earnings to conversion fees and intermediary banks.
          </p>
          <p>
            So I asked a simple question: <strong>why can't getting paid just work?</strong>
          </p>
          <p>
            The XRP Ledger answered that question. Instant settlement. Near-zero fees. Non-custodial. 
            No one can freeze your funds because <strong>you control the wallet</strong>.
          </p>
          <p>
            Netten is the product I wished existed — a payment platform for freelancers and creators who 
            work globally but keep getting blocked by systems built for a different era. If you've ever 
            lost a client because PayPal doesn't work in their country, or waited weeks for a wire to 
            clear, or watched 10% of your invoice disappear into fees — <strong className="accent">Netten 
            is for you</strong>.
          </p>
        </div>

        <div className="divider"/>

        {/* Values */}
        <div className="section">
          <div className="section-label">What I Believe</div>
          <h2>Core Principles</h2>
          <div className="values">
            <div className="value">
              <div className="value-icon">🔓</div>
              <div className="value-title">Non-Custodial First</div>
              <div className="value-desc">Your money should never sit in someone else's wallet. Your keys, your funds — always.</div>
            </div>
            <div className="value">
              <div className="value-icon">🌍</div>
              <div className="value-title">Borderless by Default</div>
              <div className="value-desc">If you have internet, you can get paid. No country restrictions. No arbitrary blocks.</div>
            </div>
            <div className="value">
              <div className="value-icon">🪞</div>
              <div className="value-title">Palindrome Philosophy</div>
              <div className="value-desc">1% fee. Reads the same forwards and back. Simple, fair, and unchanging.</div>
            </div>
          </div>
        </div>

        <div className="divider"/>

        {/* Timeline */}
        <div className="section">
          <div className="section-label">Building in Public</div>
          <h2>The Journey</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot"/>
              <div className="timeline-content">
                <h3>Live on Testnet</h3>
                <p>Full payment flow working — pay links, XRPL settlement, Net Ten rewards. All confirmed tesSUCCESS.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"/>
              <div className="timeline-content">
                <h3>777 Founding Spots</h3>
                <p>Building the founding class. $44/mo locked forever. 3 months free. Real people, real feedback.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"/>
              <div className="timeline-content">
                <h3>Coming Soon: Mainnet Launch</h3>
                <p>Taking the training wheels off. Real RLUSD. Real clients. Real transactions.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"/>
              <div className="timeline-content">
                <h3>Future: Tennet Lending</h3>
                <p>Invoice factoring on-chain. Get paid today for work you'll invoice tomorrow. Building credit history on XRPL.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-box">
          <div className="cta-title">Join the Founding Class</div>
          <div className="cta-sub">
            777 spots. $44/mo locked forever. 3 months free at launch.<br/>
            Be part of the future of freelance payments.
          </div>
          <a href="/" className="cta-btn">Claim Your Spot →</a>
        </div>

        <div className="divider"/>

        {/* Footer */}
        <footer>
          <div className="footer-links">
            <a href="/">Home</a>
            <a href="mailto:jermaine@netten.app">Contact</a>
            <a href="https://twitter.com/jermaineulinwa" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
          <div className="footer-copy">© 2026 Netten · Built with 🪞 by Jermaine Ulinwa</div>
        </footer>
      </div>
    </>
  )
}
