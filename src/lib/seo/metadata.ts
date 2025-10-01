import { Metadata } from 'next'

export interface SEOProps {
  title: string
  description: string
  canonical?: string
  openGraph?: {
    title?: string
    description?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      alt?: string
    }>
  }
  keywords?: string[]
  author?: string
}

const defaultMetadata: Metadata = {
  title: {
    default: 'Job Board - Building Careers, Connecting Opportunities',
    template: '%s | Job Board'
  },
  description: 'Discover your next career opportunity or post job openings on our modern job board platform.',
  keywords: ['jobs', 'careers', 'employment', 'hiring', 'job board', 'job search'],
  authors: [{ name: 'Job Board Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jobboard.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://jobboard.com',
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

export function generatePageMetadata(props: Partial<SEOProps>): Metadata {
  const metadata: Metadata = {
    ...defaultMetadata,
    title: props.title || defaultMetadata.title,
    description: props.description || defaultMetadata.description,
  }

  if (props.keywords) {
    metadata.keywords = [...(defaultMetadata.keywords as string[]), ...props.keywords]
  }

  if (props.openGraph) {
    metadata.openGraph = {
      ...defaultMetadata.openGraph,
      ...props.openGraph,
      title: props.openGraph.title || props.title,
      description: props.openGraph.description || props.description,
    }
  }

  if (props.canonical) {
    metadata.alternates = {
      canonical: props.canonical,
    }
  }

  return metadata
}

export function generateJobMetadata(job: {
  title: string
  company: string
  description: string
  location: string
  jobType: string
}): Metadata {
  const title = `${job.title} at ${job.company}`
  const description = `${job.jobType} position at ${job.company} in ${job.location}. ${job.description.substring(0, 150)}...`

  return generatePageMetadata({
    title,
    description,
    keywords: [
      job.title.toLowerCase(),
      job.company.toLowerCase(),
      job.location.toLowerCase(),
      job.jobType.toLowerCase(),
      'job opening',
      'career opportunity'
    ],
    openGraph: {
      title,
      description,
    }
  })
}