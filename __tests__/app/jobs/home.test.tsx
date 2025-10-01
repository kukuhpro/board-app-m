import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import HomePage from '../../../app/page'
import { JobType } from '@/domain/valueObjects/JobType'

// Mock Next.js router and search params
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

const mockJobsData = {
  success: true,
  data: {
    jobs: [
      {
        id: '1',
        title: 'Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        jobType: JobType.FULL_TIME,
        createdAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Product Manager',
        company: 'StartupInc',
        location: 'New York, NY',
        jobType: JobType.PART_TIME,
        createdAt: new Date('2024-01-02')
      }
    ],
    total: 2,
    page: 1,
    totalPages: 1
  }
}

const mockSearchParams = {
  get: jest.fn().mockReturnValue(null)
}

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any)

    mockUseSearchParams.mockReturnValue(mockSearchParams as any)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJobsData)
    })
  })

  it('should render the homepage with header and footer', async () => {
    render(<HomePage />)

    expect(screen.getByText('Job Board')).toBeInTheDocument()
    expect(screen.getByText('Discover your next career opportunity')).toBeInTheDocument()
    expect(screen.getByText('© 2024 Job Board. Built with Next.js and Supabase.')).toBeInTheDocument()
  })

  it('should fetch and display job listings', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('TechCorp')).toBeInTheDocument()
      expect(screen.getByText('Product Manager')).toBeInTheDocument()
      expect(screen.getByText('StartupInc')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1&limit=12')
  })

  it('should show loading state initially', () => {
    render(<HomePage />)

    // Should show loading spinner initially
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should display filter bar', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by location...')).toBeInTheDocument()
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument()
    })
  })

  it('should handle filter changes', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by location...')).toBeInTheDocument()
    })

    const locationInput = screen.getByPlaceholderText('Search by location...')
    fireEvent.change(locationInput, { target: { value: 'San Francisco' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1&limit=12&location=San+Francisco')
    })

    expect(mockPush).toHaveBeenCalledWith('/?location=San+Francisco', { scroll: false })
  })

  it('should handle job type filter changes', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument()
    })

    const jobTypeSelect = screen.getByDisplayValue('All Types')
    fireEvent.change(jobTypeSelect, { target: { value: JobType.FULL_TIME } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1&limit=12&jobType=Full-Time')
    })

    expect(mockPush).toHaveBeenCalledWith('/?jobType=Full-Time', { scroll: false })
  })

  it('should handle job card clicks', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    })

    const jobCard = screen.getByText('Software Engineer').closest('[role="button"]')
    expect(jobCard).toBeInTheDocument()

    fireEvent.click(jobCard!)

    expect(mockPush).toHaveBeenCalledWith('/jobs/1')
  })

  it('should handle pagination', async () => {
    const paginatedData = {
      ...mockJobsData,
      data: {
        ...mockJobsData.data,
        page: 1,
        totalPages: 3
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(paginatedData)
    })

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=2&limit=12')
    })

    expect(mockPush).toHaveBeenCalledWith('/?page=2', { scroll: false })
  })

  it('should show empty state when no jobs are found', async () => {
    const emptyData = {
      success: true,
      data: {
        jobs: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(emptyData)
    })

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument()
      expect(screen.getByText('There are no job postings matching your criteria. Try adjusting your filters or check back later.')).toBeInTheDocument()
    })
  })

  it('should handle fetch errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument()
    })
  })

  it('should initialize filters from URL search params', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'location') return 'New York'
      if (key === 'jobType') return JobType.PART_TIME
      if (key === 'page') return '2'
      return null
    })

    render(<HomePage />)

    expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=2&limit=12&location=New+York&jobType=Part-Time')
  })

  it('should clear filters when clear button is clicked', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by location...')).toBeInTheDocument()
    })

    // Add a filter first
    const locationInput = screen.getByPlaceholderText('Search by location...')
    fireEvent.change(locationInput, { target: { value: 'San Francisco' } })

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    })

    // Clear filters
    const clearButton = screen.getByText('Clear Filters')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs?page=1&limit=12')
    })

    expect(mockPush).toHaveBeenCalledWith('/', { scroll: false })
  })

  it('should show correct job count information', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 12 jobs')).toBeInTheDocument()
    })
  })

  it('should handle empty state action click', async () => {
    const emptyData = {
      success: true,
      data: {
        jobs: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(emptyData)
    })

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Post a job')).toBeInTheDocument()
    })

    const postJobButton = screen.getByText('Post a job')
    fireEvent.click(postJobButton)

    expect(mockPush).toHaveBeenCalledWith('/jobs/new')
  })
})