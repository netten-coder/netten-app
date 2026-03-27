import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Netten — Accept any payment. Settle in RLUSD.',
  description: 'Netten lets merchants accept BTC, ETH, SOL, XRP and more — instantly settled as RLUSD on the XRP Ledger.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
