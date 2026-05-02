import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | FixPro',
    default: 'FixPro — Trova i migliori professionisti per casa e ufficio',
  },
  description:
    'Piattaforma B2B2C per connettere privati con imprese artigianali verificate. Edilizia, impianti, finiture e manutenzione.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={manrope.variable}>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}