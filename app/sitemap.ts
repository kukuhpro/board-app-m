import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobboard.com'

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/jobs/new`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]

  // In a real application, you would fetch dynamic routes from your database
  // For example, all job posts:
  // const jobs = await getJobsFromDatabase()
  // const jobRoutes = jobs.map((job) => ({
  //   url: `${baseUrl}/jobs/${job.id}`,
  //   lastModified: job.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.5,
  // }))

  return [...staticRoutes]
}