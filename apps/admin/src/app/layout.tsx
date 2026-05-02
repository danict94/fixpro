import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | FixPro Admin',
    default: 'FixPro — Pannello di amministrazione',
  },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={manrope.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
