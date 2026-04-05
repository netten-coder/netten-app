'use client'

import { motion } from 'framer-motion'

const plans = [
  {
    name: 'Founding',
    price: '$44',
    originalPrice: '$59',
    period: '/mo',
    tagline: 'Lock in $15/mo savings for life',
    badge: '🔒 777 SPOTS',
    featured: true,
    features: [
      'Unlimited pay links',
      'Payment dashboard',
      'Net Ten rewards',
      '3 months free at launch',
      'Early access to new features',
      'Founding member badge',
    ],
    cta: 'Claim founding spot →',
  },
  {
    name: 'Starter',
    price: '$55',
    period: '/mo',
    tagline: 'For solo freelancers',
    featured: false,
    features: [
      'Unlimited pay links',
      'Payment dashboard',
      'Net Ten rewards',
      'Email support',
    ],
    cta: 'Get started →',
  },
  {
    name: 'Pro',
    price: '$77',
    period: '/mo',
    tagline: 'For growing businesses',
    featured: false,
    features: [
      'Everything in Starter',
      'Professional invoicing',
      'CSV exports',
      'Basic analytics',
      'Priority support',
    ],
    cta: 'Get started →',
  },
  {
    name: 'Business',
    price: '$99',
    period: '/mo',
    tagline: 'For teams and agencies',
    featured: false,
    features: [
      'Everything in Pro',
      'Webhooks & API access',
      'Team seats (up to 5)',
      'Advanced analytics',
      'Tennet lending (Month 10+)',
    ],
    cta: 'Get started →',
  },
]

export function PricingSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest text-[#B5FF4D] uppercase mb-4">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple pricing. No surprises.
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            All plans include Net Ten rewards, unlimited pay links, and our 1% flat transaction fee.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-6 ${
                plan.featured
                  ? 'bg-[#B5FF4D]/10 border-2 border-[#B5FF4D]'
                  : 'bg-[#0d2520] border border-[#1a3a32]'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B5FF4D] text-[#0a1f1a] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <h3 className={`text-lg font-semibold mb-1 ${plan.featured ? 'text-[#B5FF4D]' : 'text-white'}`}>
                {plan.name}
              </h3>
              
              {/* Tagline */}
              <p className="text-sm text-gray-500 mb-4">{plan.tagline}</p>

              {/* Price */}
              <div className="mb-6">
                {plan.originalPrice && (
                  <span className="text-gray-500 line-through text-lg mr-2">
                    {plan.originalPrice}
                  </span>
                )}
                <span className={`text-4xl font-bold ${plan.featured ? 'text-[#B5FF4D]' : 'text-white'}`}>
                  {plan.price}
                </span>
                <span className="text-gray-500">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className="text-[#B5FF4D] mt-0.5">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  plan.featured
                    ? 'bg-[#B5FF4D] text-[#0a1f1a] hover:bg-[#a8f040]'
                    : 'bg-[#1a3a32] text-white hover:bg-[#2a4a42]'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Transaction Fee Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-gray-500 mt-12 text-sm"
        >
          All plans: <span className="text-white">1% flat transaction fee</span>. No hidden charges. No currency conversion fees.
        </motion.p>
      </div>
    </section>
  )
}
