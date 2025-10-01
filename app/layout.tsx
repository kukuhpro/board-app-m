import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/contexts/ToastContext'
import { SkipNavigation } from '@/components/atoms/SkipNavigation'
import { SWRProvider } from '@/providers/SWRProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Job Board - Building Careers, Connecting Opportunities',
    template: '%s | Job Board'
  },
  description: 'Discover your next career opportunity or post job openings on our modern job board platform. Connect employers with talented candidates.',
  keywords: ['jobs', 'careers', 'employment', 'hiring', 'job board', 'job search'],
  authors: [{ name: 'Job Board Team' }],
  creator: 'Job Board',
  publisher: 'Job Board',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://jobboard.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jobboard.com',
    siteName: 'Job Board',
    title: 'Job Board - Building Careers, Connecting Opportunities',
    description: 'Discover your next career opportunity or post job openings on our modern job board platform.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Job Board - Building Careers, Connecting Opportunities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Board - Building Careers, Connecting Opportunities',
    description: 'Discover your next career opportunity or post job openings on our modern job board platform.',
    images: ['/og-image.jpg'],
    creator: '@jobboard',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <SkipNavigation />
        <SWRProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SWRProvider>
      </body>
    </html>
  )
}