/**
 * NETTEN Pricing Page
 * 
 * Checkout-style pricing page where merchants select their subscription tier.
 * Shows all tiers with features and CTAs to sign up.
 */

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | NETTEN',
  description: 'Simple, transparent pricing for crypto payments. 1% transaction fee on all plans. No hidden costs.',
};

// =============================================================================
// TIER DATA
// =============================================================================

interface Tier {
  id: string;
  name: string;
  price: number | null;
  period: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  limited?: string;
  badge?: string;
  disabled?: boolean;
}

const tiers: Tier[] = [
  {
    id: 'free-beta',
    name: 'Free beta',
    price: 0,
    period: 'forever',
    description: 'For early testers helping us build',
    features: [
      'Pay links & payments',
      'Net Ten rewards',
      'RLUSD settlement',
      'Basic dashboard',
    ],
    notIncluded: ['Limited to 10 spots'],
    cta: 'Invite only',
    ctaLink: '#',
    limited: '10 spots',
    badge: 'Beta',
    disabled: true,
  },
  {
    id: 'early-adopter',
    name: 'Early adopter',
    price: 33,
    period: '/mo forever',
    description: 'Locked rate for first 55 merchants',
    features: [
      'Everything in Free Beta',
      'Priority support',
      'Rate locked for life',
      'Early feature access',
    ],
    notIncluded: ['55 spots total'],
    cta: 'Join waitlist',
    ctaLink: '/#waitlist',
    limited: '55 spots',
  },
  {
    id: 'founding',
    name: 'Founding',
    price: 44,
    period: '/mo forever',
    description: '777 founding merchant spots',
    features: [
      'Everything in Early Adopter',
      '3 months free trial',
      'Founding member badge',
      'Early access to new features',
      'Direct founder access',
    ],
    cta: 'Claim your spot',
    ctaLink: '/auth/login?tier=founding',
    popular: true,
    limited: '777 spots',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 55,
    period: '/mo',
    description: 'For small businesses getting started',
    features: [
      'Pay links & payments',
      'Net Ten rewards',
      'RLUSD settlement',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Get started',
    ctaLink: '/auth/login?tier=starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 77,
    period: '/mo',
    description: 'For growing businesses',
    features: [
      'Everything in Starter',
      'Invoice creation',
      'CSV export',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Start free trial',
    ctaLink: '/auth/login?tier=pro',
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    period: '/mo',
    description: 'For teams and high-volume merchants',
    features: [
      'Everything in Pro',
      'Webhooks & API access',
      'Team accounts (up to 5)',
      'TENNET access at month 10',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact sales',
    ctaLink: '/auth/login?tier=business',
  },
];

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-gray-900">NETTEN</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full mb-4">
            Pricing
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            1% transaction fee on all plans. No hidden costs. No surprise fees.
            <br />
            Just honest crypto payments.
          </p>
        </div>

        {/* Beta Notice */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Limited founding spots available — lock your rate forever
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tiers.slice(0, 6).map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="bg-gray-900 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
          <p className="text-gray-400 mb-4">
            White-label solution, custom integrations, and dedicated support
          </p>
          <div className="text-3xl font-bold text-white mb-6">
            $999<span className="text-lg font-normal text-gray-400">/mo</span>
          </div>
          <Link
            href="mailto:jay@netten.app?subject=Enterprise%20Inquiry"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Contact us
            <ArrowRightIcon />
          </Link>
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            All plans include
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '💳', title: '1% transaction fee', desc: 'Flat rate, no hidden costs' },
              { icon: '💵', title: 'RLUSD settlement', desc: 'Stable USD on XRPL' },
              { icon: '🎁', title: 'Net Ten rewards', desc: 'Earn RLUSD every 10 txns' },
              { icon: '🔐', title: 'Non-custodial', desc: 'Your keys, your crypto' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-4">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Have questions?</p>
          <Link
            href="/faq"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Read our FAQ →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="text-sm text-gray-500">© 2026 NETTEN. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
              <Link href="/faq" className="text-sm text-gray-500 hover:text-gray-700">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// TIER CARD COMPONENT
// =============================================================================

function TierCard({ tier }: { tier: Tier }) {
  const isPopular = tier.popular;
  
  return (
    <div
      className={`relative bg-white rounded-xl p-6 flex flex-col ${
        isPopular
          ? 'ring-2 ring-emerald-500 shadow-lg'
          : 'border border-gray-200'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
            Most popular
          </span>
        </div>
      )}

      {/* Beta Badge */}
      {tier.badge && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${isPopular ? 'text-emerald-600' : 'text-gray-900'}`}>
          {tier.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">
            {tier.price === 0 ? '$0' : `$${tier.price}`}
          </span>
          <span className="text-gray-500">{tier.period}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4">{tier.description}</p>

      {/* Limited Spots */}
      {tier.limited && (
        <div className="mb-4 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
          {tier.limited}
        </div>
      )}

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
        {tier.notIncluded?.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <MinusIcon className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
            <span className="text-gray-400">{item}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {tier.disabled ? (
        <button
          disabled
          className="w-full py-3 px-4 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
        >
          {tier.cta}
        </button>
      ) : (
        <Link
          href={tier.ctaLink}
          className={`w-full py-3 px-4 rounded-lg font-medium text-center transition-colors ${
            isPopular
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {tier.cta}
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
