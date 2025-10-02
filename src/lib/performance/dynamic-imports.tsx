import dynamic from 'next/dynamic'
import React, { ComponentType } from 'react'

/**
 * Dynamic import configuration for code splitting
 * These components will be loaded on demand, reducing initial bundle size
 */

// Heavy organisms - loaded when needed
export const DynamicAuthForm = dynamic(
  () => import('@/components/organisms/AuthForm'),
  {
    loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />,
    ssr: false // Auth forms don't need SSR
  }
)

export const DynamicJobForm = dynamic(
  () => import('@/components/organisms/JobForm'),
  {
    loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />,
    ssr: true
  }
)

export const DynamicJobList = dynamic(
  () => import('@/components/organisms/JobList'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse bg-gray-100 rounded-lg" />
        ))}
      </div>
    ),
    ssr: true // Keep SSR for SEO
  }
)

// Heavy templates - loaded per route
export const DynamicDashboardLayout = dynamic(
  () => import('@/components/templates/DashboardLayout'),
  {
    loading: () => <div className="min-h-screen animate-pulse bg-gray-50" />,
    ssr: false // Dashboard is authenticated only
  }
)

export const DynamicJobLayout = dynamic(
  () => import('@/components/templates/JobLayout'),
  {
    loading: () => <div className="min-h-screen animate-pulse bg-gray-50" />,
    ssr: true
  }
)

// Modal components - only loaded when triggered
export const DynamicFilterBar = dynamic(
  () => import('@/components/molecules/FilterBar'),
  {
    loading: () => <div className="h-20 animate-pulse bg-gray-100 rounded-lg mb-6" />,
    ssr: false
  }
)

// Utility function for creating dynamic imports with consistent loading states
export function createDynamicComponent<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options?: {
    loading?: () => React.ReactElement
    ssr?: boolean
  }
): ComponentType<T extends ComponentType<infer P> ? P : any> {
  return dynamic(loader, {
    loading: options?.loading || (() => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )),
    ssr: options?.ssr ?? true
  })
}

// Prefetch strategy for critical paths
export const prefetchDynamicImports = () => {
  if (typeof window !== 'undefined') {
    // Prefetch auth forms for login/register pages
    if (window.location.pathname.includes('/auth')) {
      import('@/components/organisms/AuthForm')
    }

    // Prefetch job forms for authenticated users
    const isAuthenticated = localStorage.getItem('auth-storage')
    if (isAuthenticated) {
      import('@/components/organisms/JobForm')
      import('@/components/templates/DashboardLayout')
    }
  }
}