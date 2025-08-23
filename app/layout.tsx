import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/service-worker'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}