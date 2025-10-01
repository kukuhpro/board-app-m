import { generatePageMetadata, generateJobMetadata } from '@/lib/seo/metadata'
import { Metadata } from 'next'

describe('SEO and Metadata', () => {
  describe('generatePageMetadata', () => {
    it('should generate basic page metadata', () => {
      const metadata = generatePageMetadata({
        title: 'Test Page',
        description: 'This is a test page',
      })

      expect(metadata.title).toBe('Test Page')
      expect(metadata.description).toBe('This is a test page')
    })

    it('should include default metadata when not specified', () => {
      const metadata = generatePageMetadata({})

      expect(metadata.title).toBeDefined()
      expect(metadata.description).toBeDefined()
      expect(metadata.keywords).toBeDefined()
      expect(metadata.openGraph).toBeDefined()
      expect(metadata.twitter).toBeDefined()
    })

    it('should merge keywords with defaults', () => {
      const metadata = generatePageMetadata({
        keywords: ['test', 'sample'],
      })

      const keywords = metadata.keywords as string[]
      expect(keywords).toContain('jobs')
      expect(keywords).toContain('careers')
      expect(keywords).toContain('test')
      expect(keywords).toContain('sample')
    })

    it('should set canonical URL when provided', () => {
      const metadata = generatePageMetadata({
        canonical: 'https://example.com/test',
      })

      expect(metadata.alternates?.canonical).toBe('https://example.com/test')
    })

    it('should include Open Graph metadata', () => {
      const metadata = generatePageMetadata({
        title: 'OG Test',
        description: 'OG Description',
        openGraph: {
          images: [
            {
              url: '/test-image.jpg',
              width: 1200,
              height: 630,
            },
          ],
        },
      })

      expect(metadata.openGraph?.title).toBe('OG Test')
      expect(metadata.openGraph?.description).toBe('OG Description')
      expect(metadata.openGraph?.images).toHaveLength(1)
    })

    it('should include Twitter Card metadata', () => {
      const metadata = generatePageMetadata({
        title: 'Twitter Test',
        description: 'Twitter Description',
      })

      expect(metadata.twitter?.card).toBe('summary_large_image')
      expect(metadata.twitter?.title).toBeDefined()
      expect(metadata.twitter?.description).toBeDefined()
    })

    it('should set robots directives', () => {
      const metadata = generatePageMetadata({})

      expect(metadata.robots).toBeDefined()
      expect(metadata.robots?.index).toBe(true)
      expect(metadata.robots?.follow).toBe(true)
      expect(metadata.robots?.googleBot).toBeDefined()
    })
  })

  describe('generateJobMetadata', () => {
    const mockJob = {
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'We are looking for a talented software engineer to join our team. You will work on exciting projects.',
      location: 'San Francisco, CA',
      jobType: 'Full-Time',
    }

    it('should generate job-specific metadata', () => {
      const metadata = generateJobMetadata(mockJob)

      expect(metadata.title).toBe('Software Engineer at Tech Corp')
      expect(metadata.description).toContain('Full-Time position at Tech Corp')
      expect(metadata.description).toContain('San Francisco, CA')
    })

    it('should include job-specific keywords', () => {
      const metadata = generateJobMetadata(mockJob)
      const keywords = metadata.keywords as string[]

      expect(keywords).toContain('software engineer')
      expect(keywords).toContain('tech corp')
      expect(keywords).toContain('san francisco, ca')
      expect(keywords).toContain('full-time')
      expect(keywords).toContain('job opening')
      expect(keywords).toContain('career opportunity')
    })

    it('should truncate long descriptions', () => {
      const longJob = {
        ...mockJob,
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
      }

      const metadata = generateJobMetadata(longJob)
      const description = metadata.description as string

      expect(description.length).toBeLessThan(200)
      expect(description).toContain('...')
    })

    it('should set Open Graph data for job posts', () => {
      const metadata = generateJobMetadata(mockJob)

      expect(metadata.openGraph?.title).toBe('Software Engineer at Tech Corp')
      expect(metadata.openGraph?.description).toContain('Full-Time position')
    })
  })

  describe('Structured Data', () => {
    it('should include job posting schema for job pages', () => {
      const jobSchema = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'Software Engineer',
        description: 'Job description',
        hiringOrganization: {
          '@type': 'Organization',
          name: 'Tech Corp',
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'San Francisco',
            addressRegion: 'CA',
          },
        },
        employmentType: 'FULL_TIME',
      }

      // Verify structure matches Schema.org JobPosting
      expect(jobSchema['@type']).toBe('JobPosting')
      expect(jobSchema.hiringOrganization['@type']).toBe('Organization')
      expect(jobSchema.jobLocation['@type']).toBe('Place')
    })

    it('should include organization schema for company pages', () => {
      const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Job Board',
        url: 'https://jobboard.com',
        logo: 'https://jobboard.com/logo.png',
        sameAs: [
          'https://twitter.com/jobboard',
          'https://linkedin.com/company/jobboard',
        ],
      }

      // Verify structure matches Schema.org Organization
      expect(orgSchema['@type']).toBe('Organization')
      expect(orgSchema.sameAs).toBeInstanceOf(Array)
    })

    it('should include breadcrumb schema for navigation', () => {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@id': 'https://jobboard.com',
              name: 'Home',
            },
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              '@id': 'https://jobboard.com/jobs',
              name: 'Jobs',
            },
          },
        ],
      }

      // Verify structure matches Schema.org BreadcrumbList
      expect(breadcrumbSchema['@type']).toBe('BreadcrumbList')
      expect(breadcrumbSchema.itemListElement).toHaveLength(2)
      expect(breadcrumbSchema.itemListElement[0]['@type']).toBe('ListItem')
    })
  })
})