'use client'

import { motion } from 'framer-motion'

const tiers = [
  { quarter: 'Q1', months: 'Months 1-3', reward: '$0.25' },
  { quarter: 'Q2', months: 'Months 4-6', reward: '$0.50' },
  { quarter: 'Q3', months: 'Months 7-9', reward: '$1.00' },
  { quarter: 'Q4+', months: 'Month 10+', reward: '$2.00' },
]

export function NetTenSection() {
  return (
    <section className="py-24 px-6 bg-[#061512]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest text-[#B5FF4D] uppercase mb-4">
            Net Ten
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The payment platform that pays you back.
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Every 10 transactions, you earn RLUSD. It's our way of saying thanks for building with us.
          </p>
        </div>

        {/* Visual Transaction Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-[#0d2520] border border-[#1a3a32] rounded-2xl p-8 mb-12"
        >
          <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <motion.div
                key={num}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: num * 0.05, type: 'spring', stiffness: 200 }}
                viewport={{ once: true }}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-content-center text-sm font-bold ${
                  num === 10
                    ? 'bg-[#B5FF4D] text-[#0a1f1a]'
                    : 'bg-[#1a3a32] text-gray-400'
                }`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {num === 10 ? '💰' : num}
              </motion.div>
            ))}
          </div>
          <p className="text-center text-gray-400 mt-6 text-sm">
            Every 10th transaction triggers a reward payment to your wallet
          </p>
        </motion.div>

        {/* Reward Tiers */}
        <div className="grid md:grid-cols-4 gap-4">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.quarter}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`text-center p-6 rounded-xl border ${
                index === 3
                  ? 'bg-[#B5FF4D]/10 border-[#B5FF4D]/30'
                  : 'bg-[#0d2520] border-[#1a3a32]'
              }`}
            >
              <p className="text-sm text-gray-500 mb-1">{tier.quarter}</p>
              <p className="text-xs text-gray-500 mb-3">{tier.months}</p>
              <p className={`text-3xl font-bold ${index === 3 ? 'text-[#B5FF4D]' : 'text-white'}`}>
                {tier.reward}
              </p>
              <p className="text-xs text-gray-500 mt-1">per 10 transactions</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-6 bg-[#0d2520] border border-[#1a3a32] rounded-xl"
        >
          <p className="text-lg text-white">
            The longer you stay, the more you earn.
          </p>
          <p className="text-[#B5FF4D] font-semibold mt-2">
            100 transactions/month = $20/month back at top tier
          </p>
        </motion.div>
      </div>
    </section>
  )
}
