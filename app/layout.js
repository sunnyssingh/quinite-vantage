import './globals.css'
import { Toaster } from 'react-hot-toast'
import localFont from 'next/font/local'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

// Google Sans substitute (Premium Body Font)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Outfit (Modern Minimal Heading Font)
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'Quinite Vantage - AI Powered Call Automation Platform',
    template: '%s | Quinite Vantage'
  },
  description: 'Automate lead calling with AI agents. Qualify prospects intelligently and transfer interested leads to your team. TRAI compliant call automation for businesses in India.',
  keywords: [
    'AI call automation',
    'lead calling software',
    'automated calling India',
    'AI voice agent',
    'call center automation',
    'lead qualification',
    'Plivo integration',
    'OpenAI voice',
    'TRAI compliant calling',
    'business automation India'
  ],
  authors: [{ name: 'Quinite Vantage' }],
  creator: 'Quinite Vantage',
  publisher: 'Quinite Vantage',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),

  openGraph: {
    title: 'Quinite Vantage - AI-Powered Call Automation Platform',
    description: 'Automate lead calling with AI agents. Qualify prospects and transfer interested leads to your team.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'Quinite Vantage',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quinite Vantage' }],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Quinite Vantage - AI-Powered Call Automation',
    description: 'Automate lead calling with AI agents. TRAI compliant for India.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}