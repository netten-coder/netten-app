export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a1a0f] text-white px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-[#00ff88]">Privacy Policy</h1>
      <p className="text-gray-400 mb-12">Last updated: April 4, 2026</p>
      <section className="space-y-10 text-gray-300 leading-relaxed">
        <div><h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
        <p>NETTEN operates netten.app, a non-custodial crypto payment platform on the XRP Ledger. This policy explains how we handle your information.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
        <p>We collect your name, email, and XRPL wallet address when you create an account, plus transaction data to process payments.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">3. How We Use It</h2>
        <p>We use your information to provide our services, process transactions, send support messages, and comply with legal obligations.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">4. Payment Processing</h2>
        <p>Payments settle on the public XRP Ledger. Bank withdrawals are handled by MoonPay, our licensed off-ramp partner. We do not store your bank account details.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">5. Non-Custodial</h2>
        <p>NETTEN never holds your private keys or funds. You retain full control of your XRPL wallet at all times.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">6. Data Sharing</h2>
        <p>We do not sell your information. We share data only with service providers such as MoonPay and Xaman, and as required by law.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">7. Security</h2>
        <p>We implement industry-standard security measures. No method of internet transmission is 100% secure.</p></div>
        <div><h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
        <p>You may access, correct, or delete your data by contacting us at support@netten.app.</p></div>
      </section>
    </main>
  )
}
