import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'NETTEN — Accept any payment. Settle in RLUSD.',
  description: 'Accept BTC, ETH, XRP, SOL and more. Settle instantly in RLUSD on the XRP Ledger. Built for freelancers, creators and businesses.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'NETTEN — The Future of Crypto Payments',
    description: 'Accept any crypto. Settle instantly in RLUSD on the XRP Ledger. 777 founding spots at $44/mo — locked for life.',
    url: 'https://netten.app',
    siteName: 'NETTEN',
    images: [{ url: 'https://netten.app/og', width: 1200, height: 630, alt: 'NETTEN — Accept any payment. Settle in RLUSD.' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NETTEN — The Future of Crypto Payments',
    description: 'Accept any crypto. Settle instantly in RLUSD on the XRP Ledger. 777 founding spots at $44/mo — locked for life.',
    images: ['https://netten.app/og'],
    creator: '@nettenapp',
  },
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
