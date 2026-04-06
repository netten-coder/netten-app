export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a1a0f] text-white px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-[#00ff88]">Terms of Service</h1>
      <p className="text-gray-400 mb-12">Last updated: April 4, 2026</p>
      <section className="space-y-10 text-gray-300 leading-relaxed">
        <div><h2 className="text-xl font-semibold text-white mb-3">1. Acceptance</h2>
        <p>By using NETTEN you agree to these Terms. If you disagree, do not use the Service.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">2. Description</h2>
        <p>NETTEN is a non-custodial crypto payment platform on the XRP Ledger. Merchants accept cryptocurrency and settle in RLUSD. We are not a bank or money services business.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">3. Eligibility</h2>
        <p>You must be at least 18 years old and legally permitted to use crypto services in your jurisdiction.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">4. Fees</h2>
        <p>NETTEN charges a 1% network fee on incoming payments and a 1% processing fee deducted from settlements. Fees are shown transparently at checkout. MoonPay charges separately for bank withdrawals.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">5. Non-Custodial</h2>
        <p>We do not hold your private keys or funds. You are solely responsible for wallet security. We cannot recover lost keys or reverse blockchain transactions.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">6. Prohibited Uses</h2>
        <p>You may not use NETTEN for unlawful purposes, fraud, or money laundering. Violations result in account suspension.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">7. Blockchain Transactions</h2>
        <p>All payments are on the public XRP Ledger and are irreversible once confirmed. NETTEN is not responsible for user errors in wallet addresses or amounts.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">8. Net Ten Rewards</h2>
        <p>RLUSD rewards are distributed at our discretion based on transaction volume and may change quarterly.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">9. Disclaimers</h2>
        <p>The Service is provided as-is without warranties. Cryptocurrency values are volatile. We make no investment representations.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">10. Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, NETTEN is not liable for indirect, incidental, or consequential damages.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">11. Changes</h2>
        <p>We may update these Terms at any time. Continued use constitutes acceptance.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
        <p>Questions? Email support@netten.app</p></div>
      </section>
    </main>
  )
}
