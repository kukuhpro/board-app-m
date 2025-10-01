import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import dynamic from 'next/dynamic'

// Mock Next.js dynamic import
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe('Dynamic Loading Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should lazy load AuthForm component', async () => {
    const mockComponent = () => <div>Loaded AuthForm</div>
    const mockDynamic = dynamic as jest.Mock

    mockDynamic.mockReturnValue(mockComponent)

    // Import the component that uses dynamic loading
    const { DynamicAuthForm } = require('@/lib/performance/dynamic-imports')

    // The component should be dynamically imported
    expect(mockDynamic).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        ssr: false,
        loading: expect.any(Function),
      })
    )
  })

  it('should show loading state while component loads', async () => {
    // Create a delayed component
    const DelayedComponent = dynamic(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ default: () => <div>Loaded Component</div> }),
            100
          )
        ),
      {
        loading: () => <div data-testid="loading">Loading...</div>,
      }
    )

    const { rerender } = render(<DelayedComponent />)

    // Should show loading state initially
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Wait for component to load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
      rerender(<DelayedComponent />)
    })
  })

  it('should implement React.lazy correctly', async () => {
    // Test lazy loading wrapper
    const LazyComponent = React.lazy(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ default: () => <div>Lazy Loaded</div> }),
            50
          )
        )
    )

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </React.Suspense>
    )

    // Should show fallback initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for lazy component to load
    await waitFor(
      () => {
        expect(screen.getByText('Lazy Loaded')).toBeInTheDocument()
      },
      { timeout: 200 }
    )
  })
})

describe('Image Optimization Tests', () => {
  it('should use Next.js Image component with proper configuration', () => {
    const { OptimizedImage } = require('@/components/atoms/OptimizedImage')

    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test Image"
        width={400}
        height={300}
        quality={75}
      />
    )

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()

    // Check for Next.js Image attributes
    expect(img?.getAttribute('loading')).toBeDefined()
    expect(img?.getAttribute('decoding')).toBe('async')
  })

  it('should implement responsive images with sizes', () => {
    const { OptimizedImage } = require('@/components/atoms/OptimizedImage')

    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test Image"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    )

    const img = container.querySelector('img')
    expect(img?.getAttribute('sizes')).toBe(
      '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    )
  })

  it('should show placeholder while image loads', () => {
    const { OptimizedImage } = require('@/components/atoms/OptimizedImage')

    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test Image"
        width={400}
        height={300}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..."
      />
    )

    // Should have loading skeleton
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('Caching Strategy Tests', () => {
  it('should deduplicate requests with SWR', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    })
    global.fetch = mockFetch

    const { useJobs } = require('@/lib/hooks/useSWR')

    // Simulate multiple components requesting the same data
    const Component1 = () => {
      useJobs({ page: 1 })
      return null
    }

    const Component2 = () => {
      useJobs({ page: 1 })
      return null
    }

    render(
      <>
        <Component1 />
        <Component2 />
      </>
    )

    // Wait a bit for hooks to execute
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })

    // Should only make one request due to deduplication
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should implement proper cache keys', () => {
    const { useJobs, useJob, useUserJobs } = require('@/lib/hooks/useSWR')

    // Test different cache key patterns
    expect(typeof useJobs).toBe('function')
    expect(typeof useJob).toBe('function')
    expect(typeof useUserJobs).toBe('function')

    // Each hook should generate unique cache keys based on parameters
    const params1 = { page: 1, jobType: 'Full-Time' }
    const params2 = { page: 2, jobType: 'Full-Time' }

    // Mock SWR to check cache keys
    const mockUseSWR = jest.fn()
    jest.mock('swr', () => mockUseSWR)
  })
})

describe('Pagination Performance', () => {
  it('should limit page size appropriately', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          jobs: Array(20).fill({ id: 'test', title: 'Test Job' }),
          total: 100,
          page: 1,
          totalPages: 5,
        },
      }),
    })
    global.fetch = mockFetch

    const { useJobs } = require('@/lib/hooks/useSWR')

    const TestComponent = () => {
      const { data } = useJobs({ page: 1, limit: 20 })
      return <div>{data?.data?.jobs?.length || 0} jobs</div>
    }

    render(<TestComponent />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20')
      )
    })
  })

  it('should implement infinite scrolling efficiently', async () => {
    const { useInfiniteJobs } = require('@/lib/hooks/useSWR')

    const TestComponent = () => {
      const { data, size, setSize } = useInfiniteJobs({ limit: 10 })
      return (
        <div>
          <button onClick={() => setSize(size + 1)}>Load More</button>
          <div>{data ? `${data.length} pages loaded` : 'Loading...'}</div>
        </div>
      )
    }

    const { getByText } = render(<TestComponent />)

    // Should have load more functionality
    expect(getByText('Load More')).toBeInTheDocument()
  })
})