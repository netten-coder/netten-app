'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'What is RLUSD?',
    answer: 'RLUSD is a stablecoin issued by Ripple, pegged 1:1 to the US dollar. It runs on the XRP Ledger, which means near-instant settlements and minimal fees. You can convert RLUSD to your local currency through any crypto exchange that supports it.',
  },
  {
    question: "How do my clients pay if they do not have crypto?",
    answer: "They do not need crypto. When your client clicks your pay link, they can pay with card or bank transfer through MoonPay. MoonPay handles the conversion — your client pays in their currency, you receive RLUSD.",
  },
  {
    question: 'Is my money safe?',
    answer: "NETTEN is non-custodial. We never hold your funds. Payments settle directly to your XRPL wallet address. You control your private keys, which means you — and only you — control your money.",
  },
  {
    question: 'What is Net Ten?',
    answer: 'Net Ten is our rewards program. Every 10 transactions you process, we send RLUSD to your wallet. The amount increases the longer you are with us — starting at $0.25 per reward and scaling up to $2.00 per reward after 10 months.',
  },
  {
    question: 'Why 1% when Stripe is 2.9%?',
    answer: "We are built on the XRP Ledger, where transaction costs are fractions of a cent. We pass those savings to you. 1% covers our infrastructure and lets us keep building. No conversion fees, no withdrawal fees, no surprises.",
  },
  {
    question: 'What countries do you support?',
    answer: "All of them. If you have internet and an XRPL wallet, you can use NETTEN. We do not block countries, restrict industries, or freeze accounts.",
  },
  {
    question: 'How do I get my money out?',
    answer: "Your RLUSD is in your wallet — you already have it. To convert to local currency, send your RLUSD to any exchange that supports it (Bitstamp, Uphold, etc.) and withdraw to your bank. We are also working on direct off-ramp integrations for 2025.",
  },
  {
    question: 'What if I need help?',
    answer: 'Email us at support@netten.app. Founding members get priority support. We are a small team and we actually read every message.',
  },
]

function FAQItem({ question, answer, isOpen, onClick }: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <div className="border-b border-[#1a3a32]">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left hover:text-[#B5FF4D] transition-colors"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <span className={`text-[#B5FF4D] text-2xl transition-transform ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 pb-5 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 px-6 bg-[#061512]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest text-[#B5FF4D] uppercase mb-4">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Questions? We've got answers.
          </h2>
        </div>

        {/* FAQ List */}
        <div className="bg-[#0d2520] border border-[#1a3a32] rounded-2xl px-6">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
