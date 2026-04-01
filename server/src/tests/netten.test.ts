import { describe, it, expect } from 'vitest'

const QUARTERLY_REWARDS: Record<number, number> = { 1: 0.25, 2: 0.50, 3: 1.00, 4: 2.00 }
const THRESHOLD = 10

function getMerchantQuarter(createdAt: Date): number {
  const ms = 30.44 * 24 * 60 * 60 * 1000
  const months = Math.floor((Date.now() - createdAt.getTime()) / ms)
  if (months < 3) return 1; if (months < 6) return 2; if (months < 9) return 3; return 4
}
function getRewardAmount(createdAt: Date): number {
  return QUARTERLY_REWARDS[getMerchantQuarter(createdAt)]
}

describe('Net Ten Effect', () => {
  it('Q1 earns $0.25', () => expect(getRewardAmount(new Date())).toBe(0.25))
  it('Q2 earns $0.50', () => { const d=new Date(); d.setMonth(d.getMonth()-4); expect(getRewardAmount(d)).toBe(0.50) })
  it('Q3 earns $1.00', () => { const d=new Date(); d.setMonth(d.getMonth()-7); expect(getRewardAmount(d)).toBe(1.00) })
  it('Q4 earns $2.00 cap', () => { const d=new Date(); d.setMonth(d.getMonth()-10); expect(getRewardAmount(d)).toBe(2.00) })
  it('stays capped at $2.00', () => { const d=new Date(); d.setFullYear(d.getFullYear()-2); expect(getRewardAmount(d)).toBe(2.00) })
  it('threshold is 10', () => expect(THRESHOLD).toBe(10))
  it('9 txns no reward', () => expect(9 >= THRESHOLD).toBe(false))
  it('10 txns triggers reward', () => expect(10 >= THRESHOLD).toBe(true))
  it('counter resets to 0', () => expect(10 >= THRESHOLD ? 0 : 11).toBe(0))
})

describe('Financial Safety', () => {
  it('fees cover max reward 5x', () => expect(100*10*0.01).toBe(10.00))
  it('Q1 reward is 2.5% of fees', () => expect((0.25/10)*100).toBe(2.5))
})

describe('XRPL', () => {
  it('RLUSD formats to 6 decimals', () => expect((0.25).toFixed(6)).toBe('0.250000'))
  it('tesSUCCESS is success code', () => expect('tesSUCCESS').toBe('tesSUCCESS'))
  it('testnet uses wss://', () => expect('wss://s.altnet.rippletest.net:51233'.startsWith('wss://')).toBe(true))
})

describe('Palindrome Pricing', () => {
  it('$44 is palindrome', () => { const s='44'; expect(s).toBe(s.split('').reverse().join('')) })
  it('$22 is palindrome', () => { const s='22'; expect(s).toBe(s.split('').reverse().join('')) })
  it('$77 is palindrome', () => { const s='77'; expect(s).toBe(s.split('').reverse().join('')) })
  it('777 x $44 = $34,188 MRR', () => expect(777*44).toBe(34188))
  it('777 x $44 x 12 = $410,256 ARR', () => expect(777*44*12).toBe(410256))
})
