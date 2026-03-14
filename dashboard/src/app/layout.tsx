import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Life Efficiency Dashboard',
  description: 'Your personal AI productivity assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: '100vh', overflow: 'hidden' }}>{children}</body>
    </html>
  )
}
