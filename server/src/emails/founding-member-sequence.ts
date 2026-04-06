// ============================================
// NETTEN FOUNDING MEMBER EMAIL SEQUENCE
// 5 Emails + 1 Re-engagement = 6 Total
// For use with Resend
// ============================================

// Email styling constants
const BRAND_GREEN = '#7CFF6B';
const DARK_BG = '#0a1612';
const CARD_BG = 'rgba(255,255,255,0.03)';

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Netten</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${DARK_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-family: 'Orbitron', monospace; font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">NETTEN</span>
    </div>
    
    ${content}
    
    <!-- Footer -->
    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; margin-top: 32px; text-align: center;">
      <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
        Netten · Powered by XRP Ledger<br>
        <a href="https://netten.app" style="color: ${BRAND_GREEN}; text-decoration: none;">netten.app</a>
      </p>
    </div>
    
  </div>
</body>
</html>
`;

// ============================================
// EMAIL 1 — Day 0 (Immediate on signup)
// ============================================

export const email1_welcome = {
  day: 0,
  subject: "You're Founding Member #{{SPOT_NUMBER}} — Forever.",
  previewText: "Your $44/mo price is locked.",
  
  html: emailWrapper(`
    <!-- Founding Badge -->
    <div style="background: linear-gradient(135deg, rgba(124, 255, 107, 0.15), rgba(124, 255, 107, 0.05)); border: 1px solid rgba(124, 255, 107, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
      <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">Founding Member</div>
      <div style="font-size: 48px; font-weight: bold; color: ${BRAND_GREEN};">#{{SPOT_NUMBER}}</div>
      <div style="font-size: 14px; color: rgba(255,255,255,0.6);">of 777</div>
    </div>
    
    <!-- Main Content -->
    <div style="color: #ffffff; font-size: 16px; line-height: 1.8;">
      <p>Hey {{FIRST_NAME}},</p>
      
      <p>You just did something most people won't.</p>
      
      <p>While everyone else is still using PayPal and waiting 3–5 business days for international transfers, you just locked in founding access to the payment layer built for the crypto age.</p>
      
      <p style="font-weight: bold; margin-top: 24px;">Here's what you've secured:</p>
      
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND_GREEN}; font-weight: bold;">$44/mo — locked forever.</span>
          <span style="color: rgba(255,255,255,0.7);"> The public price is $59/mo. Yours never changes.</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND_GREEN}; font-weight: bold;">Founding Member status</span>
          <span style="color: rgba(255,255,255,0.7);"> — one of only 777 people in the world with this badge.</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND_GREEN}; font-weight: bold;">Early access</span>
          <span style="color: rgba(255,255,255,0.7);"> — you'll get in before the doors open to the public.</span>
        </div>
        <div>
          <span style="color: ${BRAND_GREEN}; font-weight: bold;">RLUSD Rewards</span>
          <span style="color: rgba(255,255,255,0.7);"> — every 10 transactions, automatic rewards hit your wallet.</span>
        </div>
      </div>
      
      <p>We're building something genuinely different here. No volatility risk. No middlemen holding your money. No waiting. Just — you accept crypto, it settles in RLUSD in seconds, and your revenue is stable.</p>
      
      <p style="font-weight: bold; margin-top: 24px;">One favour while you wait:</p>
      
      <p>Know a freelancer, creator, or business owner who gets paid internationally? Send them your referral link. If they join, you both get an extra month free at launch.</p>
      
      <!-- Referral Box -->
      <div style="background: rgba(124, 255, 107, 0.1); border: 1px solid rgba(124, 255, 107, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">Your referral link:</div>
        <div style="font-size: 16px; color: ${BRAND_GREEN}; word-break: break-all; font-weight: bold;">{{REFERRAL_LINK}}</div>
      </div>
      
      <p>More soon. Big things coming.</p>
      
      <p style="margin-top: 32px;">— The Netten Team</p>
      
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 24px; font-style: italic;">
        P.S. Watch your inbox. Email #2 is coming in 48 hours and it's worth reading — we're going to show you exactly why crypto payments are still broken and how we fixed it.
      </p>
    </div>
  `)
};

// ============================================
// EMAIL 2 — Day 2
// ============================================

export const email2_problem = {
  day: 2,
  subject: "The problem with getting paid in crypto (it's worse than you think)",
  previewText: "4 steps, 3 days, and you still lose 4% of your money.",
  
  html: emailWrapper(`
    <div style="color: #ffffff; font-size: 16px; line-height: 1.8;">
      <p>Hey {{FIRST_NAME}},</p>
      
      <p>Let me tell you about Alex.</p>
      
      <p>Alex is a UX designer. Talented, fully remote, works with clients in the US, Singapore, and Germany. Last year, a client in Texas wanted to pay in Bitcoin.</p>
      
      <p style="font-weight: bold;">Here's what that process looked like:</p>
      
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">1. Client sends BTC to Alex's wallet ✓</div>
        <div style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">2. Alex waits for network confirmations (~30 mins to several hours)</div>
        <div style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">3. Alex logs into a crypto exchange to convert BTC → USD</div>
        <div style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">4. Exchange takes 1.5–2.5% as a conversion fee</div>
        <div style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">5. Alex initiates a bank withdrawal</div>
        <div style="color: rgba(255,255,255,0.8); margin-bottom: 8px;">6. Bank takes another 1–3 days to process</div>
        <div style="color: rgba(255,255,255,0.8);">7. If Alex is outside the US? Add international wire fees on top.</div>
      </div>
      
      <p><strong style="color: ${BRAND_GREEN};">By the time Alex actually had spendable money, it was 3 days later and 4% of the payment was gone.</strong></p>
      
      <p>This is the state of crypto payments in 2026. And it's why most freelancers just say "no thanks" to crypto clients — even though those clients are often willing to pay more.</p>
      
      <p style="font-weight: bold; font-size: 18px; margin-top: 32px; color: ${BRAND_GREEN};">Here's what Netten does instead:</p>
      
      <p>Your client pays in BTC, ETH, SOL, XRP — whatever they have.</p>
      
      <p>The moment that payment hits? It's automatically settled into RLUSD — Ripple's regulated, USD-backed stablecoin — directly on the XRP Ledger.</p>
      
      <div style="background: linear-gradient(135deg, rgba(124, 255, 107, 0.15), rgba(124, 255, 107, 0.05)); border: 1px solid rgba(124, 255, 107, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <div style="font-size: 18px; color: #ffffff; font-weight: bold;">No exchange. No conversion fee. No bank wait. No volatility.</div>
        <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 8px;">In the time it takes to read this email, your payment is settled and stable.</div>
      </div>
      
      <p style="font-weight: bold;">That's what we built.</p>
      
      <p>You're already on the inside. We'll see you at launch.</p>
      
      <p style="margin-top: 32px;">— The Netten Team</p>
      
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 24px; font-style: italic;">
        P.S. RLUSD is fully regulated and USD-backed 1:1. Your $500 payment lands as $500. Always.
      </p>
    </div>
  `)
};

// ============================================
// EMAIL 3 — Day 5
// ============================================

export const email3_benefits = {
  day: 5,
  subject: "Your founding member benefits — the full breakdown",
  previewText: "Here's everything you locked in (it's more than you think).",
  
  html: emailWrapper(`
    <div style="color: #ffffff; font-size: 16px; line-height: 1.8;">
      <p>Hey {{FIRST_NAME}},</p>
      
      <p>We've had a lot of people ask: "What exactly do I get as a Founding Member?"</p>
      
      <p>Fair question. Let's go through it properly.</p>
      
      <!-- Benefit 1 -->
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="font-size: 20px; font-weight: bold; color: ${BRAND_GREEN}; margin-bottom: 12px;">Founding Price: $44/mo — Forever</div>
        <p style="color: rgba(255,255,255,0.8); margin: 0;">The public launch price is $59/mo. As a Founding Member, you pay $44/mo for as long as you use Netten. No price increases. No "grandfathering" that quietly expires. <strong>Locked. In. Permanently.</strong></p>
        <p style="color: ${BRAND_GREEN}; margin: 12px 0 0 0; font-weight: bold;">Over 3 years, that's $540 saved compared to the public price.</p>
      </div>
      
      <!-- Benefit 2 -->
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="font-size: 20px; font-weight: bold; color: ${BRAND_GREEN}; margin-bottom: 12px;">Accept Any Crypto, Settle in Seconds</div>
        <p style="color: rgba(255,255,255,0.8); margin: 0;">Bitcoin. Ethereum. Solana. XRP. DOGE. USDC. ADA. HBAR. 12+ coins accepted at launch — more coming.</p>
        <p style="color: rgba(255,255,255,0.8); margin: 12px 0 0 0;">Every payment settles in RLUSD on the XRP Ledger in seconds. Your revenue is always stable, always on-chain, always yours.</p>
      </div>
      
      <!-- Benefit 3 -->
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="font-size: 20px; font-weight: bold; color: ${BRAND_GREEN}; margin-bottom: 12px;">Non-Custodial. Always.</div>
        <p style="color: rgba(255,255,255,0.8); margin: 0;">We never touch your money. Not for a second. Payments go directly to your wallet. Netten is the infrastructure — you're the owner.</p>
        <p style="color: rgba(255,255,255,0.8); margin: 12px 0 0 0;">This isn't just a nice feature. It's a fundamental philosophy. In a world of exchange collapses and frozen accounts, non-custodial isn't optional anymore.</p>
      </div>
      
      <!-- Benefit 4 -->
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="font-size: 20px; font-weight: bold; color: ${BRAND_GREEN}; margin-bottom: 12px;">Automatic RLUSD Rewards</div>
        <p style="color: rgba(255,255,255,0.8); margin: 0;">Every 10 transactions, Netten automatically deposits RLUSD rewards into your wallet. The more you use it, the more you earn. It's not a points system. It's not "credits." <strong>It's real money, on-chain, in your wallet.</strong></p>
      </div>
      
      <!-- Benefit 5 -->
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="font-size: 20px; font-weight: bold; color: ${BRAND_GREEN}; margin-bottom: 12px;">Founding Member Badge</div>
        <p style="color: rgba(255,255,255,0.8); margin: 0;">777 spots. That's it. Your profile will carry the Founding Member badge — a permanent mark that you were here first. We'll be honouring that in ways we'll announce closer to launch.</p>
      </div>
      
      <div style="background: linear-gradient(135deg, rgba(124, 255, 107, 0.15), rgba(124, 255, 107, 0.05)); border: 1px solid rgba(124, 255, 107, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #ffffff; margin: 0;">Your dashboard is coming soon. We'll send you a private link to set up your wallet connection before the public launch so you're ready to go live on day one.</p>
      </div>
      
      <p>Any questions? Hit reply — we read every email.</p>
      
      <p style="margin-top: 32px;">— The Netten Team</p>
    </div>
  `)
};

// ============================================
// EMAIL 4 — Day 10
// ============================================

export const email4_caseStudy = {
  day: 10,
  subject: "How a creator made $11,000 without a single bank transfer",
  previewText: "No wire fees. No conversion losses. No delays.",
  
  html: emailWrapper(`
    <div style="color: #ffffff; font-size: 16px; line-height: 1.8;">
      <p>Hey {{FIRST_NAME}},</p>
      
      <p>Picture this.</p>
      
      <p>Maya runs a digital product business. Notion templates, Figma UI kits, online courses. She sells globally — buyers in Nigeria, Indonesia, Brazil, Canada, the UK.</p>
      
      <p>Her old setup: PayPal (blocked in some countries), Stripe (not available where half her customers are), and the occasional "just send me crypto" that turned into a 4-step headache.</p>
      
      <p style="font-weight: bold;">Then she started accepting crypto properly.</p>
      
      <p>In her first 90 days of accepting BTC, ETH, and USDC through a non-custodial, instant-settlement gateway, here's what changed:</p>
      
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="color: ${BRAND_GREEN}; font-size: 20px; margin-right: 12px;">✓</span>
          <span style="color: #ffffff;"><strong>Zero</strong> failed payments from unsupported countries</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="color: ${BRAND_GREEN}; font-size: 20px; margin-right: 12px;">✓</span>
          <span style="color: #ffffff;"><strong>Zero</strong> conversion losses — every payment settled in a stable asset</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="color: ${BRAND_GREEN}; font-size: 20px; margin-right: 12px;">✓</span>
          <span style="color: #ffffff;"><strong>3 new markets</strong> opened — buyers who previously couldn't pay her now could</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="color: ${BRAND_GREEN}; font-size: 20px; margin-right: 12px;">✓</span>
          <span style="color: #ffffff;"><strong>$11,000</strong> processed — with $0 in wire fees and no bank intermediary</span>
        </div>
      </div>
      
      <p><strong style="color: ${BRAND_GREEN};">The thing nobody tells you about going global is that the payment layer is usually the bottleneck — not the product, not the marketing.</strong></p>
      
      <p>When the payment layer disappears, the business grows.</p>
      
      <p>That's exactly what Netten is designed to do.</p>
      
      <div style="background: linear-gradient(135deg, rgba(124, 255, 107, 0.15), rgba(124, 255, 107, 0.05)); border: 1px solid rgba(124, 255, 107, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #ffffff; margin: 0; font-weight: bold;">You're already positioned for this. Your founding spot is held.</p>
      </div>
      
      <p>We'd love to hear — what's your biggest payment frustration right now? Hit reply and tell us. We're genuinely building based on what our founding members need.</p>
      
      <p style="margin-top: 32px;">— The Netten Team</p>
      
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 24px; font-style: italic;">
        P.S. Your referral link is still live: <span style="color: ${BRAND_GREEN};">{{REFERRAL_LINK}}</span>. Every person you bring in gets you one extra month free at launch — and moves them into the founding window before it closes.
      </p>
    </div>
  `)
};

// ============================================
// EMAIL 5 — Day 14
// ============================================

export const email5_urgency = {
  day: 14,
  subject: "{{SPOTS_REMAINING}} founding spots left. This is the last nudge.",
  previewText: "After 777, the price goes to $59/mo. Permanently.",
  
  html: emailWrapper(`
    <div style="color: #ffffff; font-size: 16px; line-height: 1.8;">
      <p>Hey {{FIRST_NAME}},</p>
      
      <p>I'm going to keep this one short.</p>
      
      <p>The founding window is filling up. As of today, <strong style="color: ${BRAND_GREEN}; font-size: 20px;">{{SPOTS_REMAINING}} spots</strong> remain out of 777.</p>
      
      <p>When they're gone, they're gone. The price moves to $59/mo publicly and founding membership closes permanently.</p>
      
      <div style="background: linear-gradient(135deg, rgba(124, 255, 107, 0.15), rgba(124, 255, 107, 0.05)); border: 1px solid rgba(124, 255, 107, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: ${BRAND_GREEN}; font-weight: bold; font-size: 18px; margin: 0;">You're already in. Your $44/mo is locked.</p>
      </div>
      
      <p>But if there's someone in your world — a freelancer, a creator, an agency owner, a developer who gets paid in crypto — now is literally the last moment to get them in at the founding price.</p>
      
      <p style="font-weight: bold;">Your referral link:</p>
      <div style="background: rgba(124, 255, 107, 0.1); border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
        <span style="color: ${BRAND_GREEN}; font-weight: bold; word-break: break-all;">{{REFERRAL_LINK}}</span>
      </div>
      
      <p>Send it to one person today. That's all.</p>
      
      <p style="font-weight: bold; margin-top: 24px;">Here's a message you can copy and paste:</p>
      
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="color: rgba(255,255,255,0.9); margin: 0; font-style: italic;">"Hey — I've been following this crypto payment platform called Netten. It lets you accept any crypto and settle instantly in a stablecoin, non-custodial, with automatic rewards. They have 777 founding spots at $44/mo (goes to $59 at launch). Thought of you — {{REFERRAL_LINK}}"</p>
      </div>
      
      <p>Done. 30 seconds. Could save them $540 over 3 years.</p>
      
      <p>We'll be in touch with launch details very soon.</p>
      
      <p style="font-weight: bold; color: ${BRAND_GREEN};">Thank you for being one of the first 777.</p>
      
      <p style="margin-top: 32px;">— The Netten Team</p>
      
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 24px; font-style: italic;">
        P.S. Questions about the platform? Features? Anything? Just reply to this email. We're a small team and we read everything.
      </p>
    </div>
  `)
};

// ============================================
// BONUS: Re-engagement Email (Day 30)
// ============================================

export const email6_reengagement = {
  day: 30,
  subject: "Did we lose you?",
  previewText: "Your founding spot is still held — but not forever.",
  
  html: emailWrapper(`
    <div style="color: #ffffff; font-size: 16px; line-height: 1.8;">
      <p>Hey {{FIRST_NAME}},</p>
      
      <p>We noticed you haven't opened our last few emails.</p>
      
      <p>That's okay — inboxes are brutal. But we wanted to reach out one more time because your founding spot is still reserved and we'd hate for you to miss it.</p>
      
      <p style="font-weight: bold; margin-top: 24px;">Here's the 60-second version of everything:</p>
      
      <div style="background: ${CARD_BG}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND_GREEN}; margin-right: 8px;">→</span>
          <span style="color: #ffffff;">Netten lets you accept <strong>12+ cryptocurrencies</strong> and settle instantly in RLUSD (a USD-backed stablecoin)</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND_GREEN}; margin-right: 8px;">→</span>
          <span style="color: #ffffff;">It's <strong>non-custodial</strong> — your money never touches our servers</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND_GREEN}; margin-right: 8px;">→</span>
          <span style="color: #ffffff;">You locked in <strong>$44/mo forever</strong> (public price is $59)</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND_GREEN}; margin-right: 8px;">→</span>
          <span style="color: #ffffff;">You earn <strong>automatic RLUSD rewards</strong> every 10 transactions</span>
        </div>
        <div>
          <span style="color: ${BRAND_GREEN}; margin-right: 8px;">→</span>
          <span style="color: #ffffff;">There are <strong style="color: ${BRAND_GREEN};">{{SPOTS_REMAINING}} founding spots</strong> left</span>
        </div>
      </div>
      
      <p>If this is still relevant to you — great, sit tight, launch is coming.</p>
      
      <p>If your situation has changed and you want to give up your spot so someone else can take it, just reply and let us know.</p>
      
      <p>Either way — no hard feelings. We just want the 777 founding spots to go to people who are genuinely excited.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://netten.app" style="display: inline-block; background: ${BRAND_GREEN}; color: #0a1612; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Still in? Visit Netten →</a>
      </div>
      
      <p style="margin-top: 32px;">— The Netten Team</p>
    </div>
  `)
};

// ============================================
// Export all emails as sequence
// ============================================

export const foundingMemberSequence = [
  email1_welcome,
  email2_problem,
  email3_benefits,
  email4_caseStudy,
  email5_urgency,
  email6_reengagement
];

export default foundingMemberSequence;
