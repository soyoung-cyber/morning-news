import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Morning Brief',
  description: 'Daily US design, tech & startup news',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
