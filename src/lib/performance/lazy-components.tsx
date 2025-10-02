'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { LoadingSpinner } from '@/components/atoms'

/**
 * React.lazy implementations for client-side components
 * These are used for components that don't need SSR
 */

// Lazy load heavy client-side components
export const LazyFilterBar = lazy(() =>
  import('@/components/molecules/FilterBar')
)

export const LazyJobCard = lazy(() =>
  import('@/components/molecules/JobCard')
)

export const LazyEmptyState = lazy(() =>
  import('@/components/molecules/EmptyState')
)

// Wrapper component for lazy loaded components with consistent loading state
interface LazyWrapperProps {
  Component: ComponentType<any>
  props?: any
  fallback?: React.ReactNode
}

export function LazyWrapper({ Component, props = {}, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={
      fallback || (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="medium" />
        </div>
      )
    }>
      <Component {...props} />
    </Suspense>
  )
}

// Utility function to create lazy loaded components with custom loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ [key: string]: T }>,
  exportName: string = 'default'
) {
  return lazy(() =>
    importFunc().then(module => ({
      default: module[exportName] as T
    }))
  )
}

// Preload functions for critical user paths
export const preloadComponents = {
  filterBar: () => import('@/components/molecules/FilterBar'),
  jobCard: () => import('@/components/molecules/JobCard'),
  emptyState: () => import('@/components/molecules/EmptyState'),
  jobForm: () => import('@/components/organisms/JobForm'),
  authForm: () => import('@/components/organisms/AuthForm'),
}

// Strategy for preloading based on user actions
export function setupPreloading() {
  if (typeof window === 'undefined') return

  // Preload filter bar when hovering over search area
  const searchArea = document.querySelector('[data-preload="filter"]')
  if (searchArea) {
    searchArea.addEventListener('mouseenter', () => {
      preloadComponents.filterBar()
    }, { once: true })
  }

  // Preload auth form when hovering over login/register links
  const authLinks = document.querySelectorAll('[data-preload="auth"]')
  authLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      preloadComponents.authForm()
    }, { once: true })
  })

  // Preload job form when hovering over create job button
  const createJobBtn = document.querySelector('[data-preload="job-form"]')
  if (createJobBtn) {
    createJobBtn.addEventListener('mouseenter', () => {
      preloadComponents.jobForm()
    }, { once: true })
  }
}

// Intersection Observer for viewport-based lazy loading
export function useLazyLoadOnScroll(
  ref: React.RefObject<HTMLElement>,
  onIntersect: () => void
) {
  if (typeof window === 'undefined') return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onIntersect()
          observer.disconnect()
        }
      })
    },
    {
      rootMargin: '100px', // Start loading 100px before element is visible
      threshold: 0.01
    }
  )

  if (ref.current) {
    observer.observe(ref.current)
  }

  return () => observer.disconnect()
}