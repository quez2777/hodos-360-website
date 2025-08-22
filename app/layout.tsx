import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HODOS 360 LLC - AI-Powered Legal Tech Solutions',
  description: 'Transform your law firm with AI-driven solutions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}