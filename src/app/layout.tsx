import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryClientProviderWrapper } from '@/providers/query-client-provider'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'News Portal',
  description: 'A modern news portal for authors and readers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProviderWrapper>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)] bg-gray-50">
            {children}
          </main>
        </QueryClientProviderWrapper>
      </body>
    </html>
  )
}
