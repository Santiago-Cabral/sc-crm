import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SC Software CRM',
  description: 'CRM comercial para SC Software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geist.className} bg-zinc-950 text-zinc-100 antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}