'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: '🔗',
    title: 'Instant pay links',
    body: 'Generate a payment link in seconds. Share via email, text, or social. Track who paid and when.',
  },
  {
    icon: '📄',
    title: 'Professional invoices',
    body: 'Create branded invoices with line items. Automatic payment tracking. PDF export included.',
  },
  {
    icon: '🎯',
    title: 'Net Ten rewards',
    body: 'Every 10 transactions, we pay you RLUSD. The more you use NETTEN, the more you earn back.',
  },
  {
    icon: '💎',
    title: '1% flat fee',
    body: "One percent. That's it. No hidden charges, no currency conversion markups, no withdrawal fees.",
  },
  {
    icon: '🔐',
    title: 'Non-custodial',
    body: 'Your wallet, your keys, your money. We never hold your funds. Settlements go directly to your XRPL address.',
  },
  {
    icon: '🌍',
    title: 'Works everywhere',
    body: 'No blocked countries. No restricted industries. If you have internet and a wallet, you can use NETTEN.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest text-[#B5FF4D] uppercase mb-4">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Everything you need. Nothing you don't.
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-[#0d2520] border border-[#1a3a32] rounded-2xl p-6 hover:border-[#B5FF4D]/30 transition-colors group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
