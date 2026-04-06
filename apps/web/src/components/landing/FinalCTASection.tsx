'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function FinalCTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-[#0d2520] border border-[#1a3a32] rounded-2xl p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get paid without the friction?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join 777 founding members building the future of freelance payments.
          </p>

          {/* Email Form */}
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 bg-[#0a1f1a] border border-[#1a3a32] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#B5FF4D]"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#B5FF4D] text-[#0a1f1a] font-semibold rounded-xl hover:bg-[#a8f040] transition-colors whitespace-nowrap"
            >
              Claim spot →
            </button>
          </form>

          <p className="text-sm text-gray-500">
            No credit card required. 3 months free at launch.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  const links = [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: 'mailto:jermaine@netten.app' },
    { label: 'Twitter', href: 'https://twitter.com/jermaineulinwa', external: true },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ]

  return (
    <footer className="py-12 px-6 border-t border-[#1a3a32]">
      <div className="max-w-5xl mx-auto">
        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {links.map((link) => (
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        {/* Bottom */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            © 2026 NETTEN. Built on the XRP Ledger.
          </p>
          <p className="text-sm text-gray-600">
            Made with <span className="text-[#B5FF4D]">🪞</span> by Jermaine Ulinwa
          </p>
        </div>
      </div>
    </footer>
  )
}
