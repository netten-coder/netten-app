'use client'

import { motion } from 'framer-motion'

const painPoints = [
  {
    icon: '🚫',
    title: 'Blocked before you start',
    body: "PayPal and Stripe don't work in 60+ countries. If you're a freelancer in Nigeria, Pakistan, or Bangladesh — you're locked out of the global economy.",
  },
  {
    icon: '🔒',
    title: 'Your money, held hostage',
    body: 'PayPal can hold your funds for 180 days. Stripe freezes accounts with no warning. You did the work, but someone else controls when you get paid.',
  },
  {
    icon: '📉',
    title: 'Death by a thousand cuts',
    body: '2.9% + $0.30 per transaction. Currency conversion fees. Withdrawal fees. Wire transfer fees. By the time you are paid, 8-15% is gone.',
  },
]

export function ProblemSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest text-[#B5FF4D] uppercase mb-4">
            The Problem
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Getting paid shouldn't feel like a fight.
          </h2>
        </div>

        {/* Pain Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {painPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-[#0d2520] border border-[#1a3a32] rounded-2xl p-8 hover:border-[#2a4a42] transition-colors"
            >
              <div className="text-4xl mb-4">{point.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {point.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {point.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
