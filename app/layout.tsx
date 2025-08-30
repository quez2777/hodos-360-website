import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/service-worker'
import { LoadingProvider } from '@/components/providers/loading-provider'

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
    <html lang="en" className="dark" style={{ backgroundColor: '#0A0F1C' }}>
      <body className={`${inter.className} dark bg-[#0A0F1C] text-white min-h-screen`} style={{ backgroundColor: '#0A0F1C' }}>
        <ServiceWorkerRegistration />
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  )
}