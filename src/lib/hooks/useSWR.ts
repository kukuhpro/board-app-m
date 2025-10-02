import useSWR, { SWRConfiguration, SWRResponse } from 'swr'
import { mutate } from 'swr'
import useSWRInfinite from 'swr/infinite'

/**
 * Default fetcher function for SWR
 */
const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }

  return response.json()
}

/**
 * SWR configuration with optimized caching strategy
 */
const defaultConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateIfStale: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  errorRetryInterval: 5000,
  errorRetryCount: 3,
  shouldRetryOnError: true,
  keepPreviousData: true,
}

/**
 * Hook for fetching job listings with caching
 */
export function useJobs(params?: {
  page?: number
  limit?: number
  jobType?: string
  location?: string
  search?: string
}) {
  const queryParams = new URLSearchParams()

  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.jobType) queryParams.set('jobType', params.jobType)
  if (params?.location) queryParams.set('location', params.location)
  if (params?.search) queryParams.set('search', params.search)

  const url = `/api/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 60000, // Refresh every minute
    revalidateOnMount: true,
  })
}

/**
 * Hook for fetching a single job with caching
 */
export function useJob(id: string | null) {
  return useSWR(
    id ? `/api/jobs/${id}` : null,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 0, // Don't auto-refresh single job
      revalidateOnMount: true,
    }
  )
}

/**
 * Hook for fetching user's jobs with caching
 */
export function useUserJobs(userId?: string) {
  return useSWR(
    userId ? `/api/users/${userId}/jobs` : '/api/users/jobs',
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnMount: true,
    }
  )
}

/**
 * Hook for infinite scrolling of jobs
 */
export function useInfiniteJobs(params?: {
  limit?: number
  jobType?: string
  location?: string
  search?: string
}) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    // Reached the end
    if (previousPageData && !previousPageData.data?.jobs?.length) return null

    const queryParams = new URLSearchParams()
    queryParams.set('page', (pageIndex + 1).toString())
    queryParams.set('limit', (params?.limit || 20).toString())

    if (params?.jobType) queryParams.set('jobType', params.jobType)
    if (params?.location) queryParams.set('location', params.location)
    if (params?.search) queryParams.set('search', params.search)

    return `/api/jobs?${queryParams.toString()}`
  }

  return useSWRInfinite(getKey, fetcher, {
    ...defaultConfig,
    revalidateFirstPage: false,
    revalidateAll: false,
    parallel: true,
  })
}

/**
 * Hook for session management with caching
 */
export function useSession() {
  return useSWR('/api/auth/session', fetcher, {
    ...defaultConfig,
    refreshInterval: 0,
    revalidateOnMount: true,
    revalidateOnFocus: true, // Check session on focus
    shouldRetryOnError: false, // Don't retry on 401
  })
}

/**
 * Prefetch function for critical data
 */
export async function prefetchJobs() {
  // Prefetch first page of jobs
  await fetcher('/api/jobs?page=1&limit=20')
}

/**
 * Cache mutation helpers
 */
export const mutateJobs = () => {
  // Revalidate all job-related caches
  return Promise.all([
    mutate((key: string) => typeof key === 'string' && key.startsWith('/api/jobs')),
    mutate('/api/users/jobs'),
  ])
}

export const mutateJob = (id: string) => {
  return mutate(`/api/jobs/${id}`)
}

/**
 * Optimistic update helper
 */
export function optimisticUpdate<T>(
  key: string,
  updateFn: (data: T) => T
): Promise<T | undefined> {
  return mutate(
    key,
    async (currentData: T | undefined) => {
      if (!currentData) return currentData
      return updateFn(currentData)
    },
    {
      revalidate: false,
      populateCache: true,
    }
  )
}

/**
 * Clear all SWR cache
 */
export function clearCache() {
  return mutate(() => true, undefined, { revalidate: false })
}