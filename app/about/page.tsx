'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a1f1a]">
      {/* Navigation */}
      <nav className="py-6 px-6 border-b border-[#1a3a32]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#B5FF4D] rounded-lg flex items-center justify-center text-[#0a1f1a] font-bold text-sm">
              N
            </div>
            <span className="text-white font-semibold">NETTEN</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <article className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Photo placeholder - replace with actual image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            {/* Replace this div with an actual Image component when you have the photo */}
            <div className="w-32 h-32 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-4xl mb-8">
              {/* Placeholder - replace with: 
              <Image src="/jermaine.jpg" alt="Jermaine Ulinwa" width={128} height={128} className="rounded-2xl" /> 
              */}
              👤
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Hi, I'm Jermaine.
            </h1>
            <p className="text-xl text-gray-400">
              I built Netten because I was tired of payment platforms that don't work for everyone.
            </p>
          </motion.div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6 text-gray-300 leading-relaxed"
          >
            <p>
              For years, I watched talented freelancers — designers, developers, writers — get 
              locked out of the global economy. PayPal doesn't work in their country. Stripe 
              blocks their industry. Even when they do get access, 10% of their earnings vanish 
              to fees and currency conversion.
            </p>

            <p>
              I built Netten to fix this. It's a payment platform that works everywhere, settles 
              instantly, and charges 1% flat. No blocked countries. No held funds. No surprises.
            </p>

            <p>
              Netten is built on the XRP Ledger using RLUSD — a stablecoin that settles in 
              seconds and costs fractions of a cent to transfer. It's non-custodial, which means 
              we never touch your money. You own your wallet, you control your funds.
            </p>

            <p>
              I'm building this as a solo founder, which means I move fast and I actually read 
              your emails. If you have feedback, questions, or just want to say hi — reach out.
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 pt-12 border-t border-[#1a3a32]"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Get in touch</h2>
            <div className="space-y-3">
              <a
                href="mailto:jermaine@netten.app"
                className="flex items-center gap-3 text-gray-400 hover:text-[#B5FF4D] transition-colors"
              >
                <span>📧</span>
                <span>jermaine@netten.app</span>
              </a>
              <a
                href="https://twitter.com/jermaineulinwa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-[#B5FF4D] transition-colors"
              >
                <span>𝕏</span>
                <span>@jermaineulinwa</span>
              </a>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-12"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#B5FF4D] text-[#0a1f1a] font-semibold rounded-xl hover:bg-[#a8f040] transition-colors"
            >
              Join the waitlist →
            </Link>
          </motion.div>
        </div>
      </article>

      {/* Simple Footer */}
      <footer className="py-8 px-6 border-t border-[#1a3a32]">
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-600">
          © 2026 Netten. Built on the XRP Ledger.
        </div>
      </footer>
    </main>
  )
}
