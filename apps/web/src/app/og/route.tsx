import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: '1200px', height: '630px', background: '#041E17', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', position: 'relative' }}>
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(29,158,117,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(29,158,117,0.08) 1px, transparent 1px)', backgroundSize: '60px 60px', display: 'flex' }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,255,107,0.15) 0%, transparent 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.2) 0%, transparent 70%)', display: 'flex' }} />
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', border: '2px solid #7CFF6B', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(124,255,107,0.4)' }}>
            <span style={{ color: '#7CFF6B', fontSize: '28px', fontWeight: 900 }}>N</span>
          </div>
          <span style={{ color: '#7CFF6B', fontSize: '36px', fontWeight: 900, letterSpacing: '6px' }}>NETTEN</span>
        </div>
        {/* Headline */}
        <div style={{ color: 'white', fontSize: '64px', fontWeight: 900, textAlign: 'center', lineHeight: 1.1, marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span>The Future of</span>
          <span style={{ color: '#7CFF6B' }}>Crypto Payments</span>
        </div>
        {/* Subtitle */}
        <div style={{ color: '#9FE1CB', fontSize: '24px', textAlign: 'center', marginBottom: '48px', maxWidth: '700px', display: 'flex' }}>
          Accept any crypto. Settle instantly in RLUSD on the XRP Ledger.
        </div>
        {/* Coins */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '800px' }}>
          {['BTC', 'ETH', 'XRP', 'SOL', 'RLUSD', 'DOGE', 'BNB', 'USDC'].map(coin => (
            <div key={coin} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '8px 20px', color: 'white', fontSize: '16px', fontWeight: 600, display: 'flex' }}>
              {coin}
            </div>
          ))}
        </div>
        {/* CTA */}
        <div style={{ position: 'absolute', bottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#7CFF6B', color: '#041E17', borderRadius: '8px', padding: '12px 28px', fontSize: '18px', fontWeight: 700, display: 'flex' }}>
            Join 777 Founding Members → netten.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
