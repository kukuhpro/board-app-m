'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

/**
 * SWR Provider with global configuration
 * Provides caching, deduplication, and error handling for all data fetching
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global fetcher
        fetcher: (url: string) => fetch(url).then(res => res.json()),

        // Error handling
        onError: (error, key) => {
          console.error(`SWR Error for ${key}:`, error)
        },

        // Performance optimizations
        dedupingInterval: 2000, // Dedupe requests within 2 seconds
        focusThrottleInterval: 5000, // Throttle focus revalidation to 5 seconds

        // Retry configuration
        errorRetryInterval: 5000,
        errorRetryCount: 3,
        shouldRetryOnError: (error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return true
        },

        // Loading states
        suspense: false, // Don't use Suspense by default

        // Cache configuration
        provider: () => {
          // Use localStorage for persistent cache in production
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            const map = new Map<string, any>()

            // Try to restore from localStorage
            try {
              const stored = localStorage.getItem('swr-cache')
              if (stored) {
                const parsed = JSON.parse(stored)
                Object.entries(parsed).forEach(([key, value]) => {
                  map.set(key, value)
                })
              }
            } catch (e) {
              console.error('Failed to restore SWR cache:', e)
            }

            // Save to localStorage on changes (debounced)
            let saveTimeout: NodeJS.Timeout
            const save = () => {
              clearTimeout(saveTimeout)
              saveTimeout = setTimeout(() => {
                try {
                  const obj: Record<string, any> = {}
                  map.forEach((value, key) => {
                    // Only cache GET requests
                    if (key.startsWith('/api/')) {
                      obj[key] = value
                    }
                  })
                  localStorage.setItem('swr-cache', JSON.stringify(obj))
                } catch (e) {
                  console.error('Failed to save SWR cache:', e)
                }
              }, 1000)
            }

            return {
              get: (key: string) => map.get(key),
              set: (key: string, value: any) => {
                map.set(key, value)
                save()
              },
              delete: (key: string) => {
                map.delete(key)
                save()
              },
              clear: () => {
                map.clear()
                localStorage.removeItem('swr-cache')
              }
            }
          }

          // Use Map for in-memory cache in development
          return new Map()
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}