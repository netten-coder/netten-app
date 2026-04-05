'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Create a pay link',
    body: 'Set your amount in any currency. Get a unique link in seconds. No invoicing software needed — just share and get paid.',
  },
  {
    number: '02',
    title: 'Client pays their way',
    body: 'Your client pays with card, bank transfer, or crypto. MoonPay handles the conversion. They pay in their currency — you receive RLUSD.',
  },
  {
    number: '03',
    title: 'RLUSD hits your wallet',
    body: 'Settlement in 3-5 seconds on the XRP Ledger. Non-custodial — we never touch your funds. Convert to local currency anytime.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-[#061512]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest text-[#B5FF4D] uppercase mb-4">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Three steps. Instant settlement.
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connector line (not on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-[#1a3a32] to-transparent" />
              )}
              
              {/* Step number */}
              <div className="text-6xl font-bold text-[#B5FF4D] opacity-30 mb-4">
                {step.number}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-[#B5FF4D] mt-16 text-lg"
        >
          No blocked countries. No held funds. No surprise fees. Just payments that work.
        </motion.p>
      </div>
    </section>
  )
}
