import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomePage from '../../app/page'
import JobDetailPage from '../../app/jobs/[id]/page'
import {
  renderWithProviders,
  mockSupabaseClient,
  mockUnauthenticatedUser,
  testJobs,
  waitForLoadingToFinish
} from './test-utils'

// Mock the router
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the Supabase client
jest.mock('../../src/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('Job Discovery Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUnauthenticatedUser()
  })

  describe('Home Page Job Listings', () => {
    it('should display all available jobs on home page', async () => {
      // Mock fetching all jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob, testJobs.partTimeJob, testJobs.contractJob],
          count: 3,
          error: null,
        }),
      })

      renderWithProviders(<HomePage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.getByText('Part-Time Designer')).toBeInTheDocument()
        expect(screen.getByText('Contract Developer')).toBeInTheDocument()
      })

      // Verify job details are displayed
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('Design Studio')).toBeInTheDocument()
      expect(screen.getByText('Startup Inc')).toBeInTheDocument()

      // Verify job types are shown
      expect(screen.getByText('Full-Time')).toBeInTheDocument()
      expect(screen.getByText('Part-Time')).toBeInTheDocument()
      expect(screen.getByText('Contract')).toBeInTheDocument()
    })

    it('should handle empty job list gracefully', async () => {
      // Mock empty job list
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      })

      renderWithProviders(<HomePage />)

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText(/no jobs available at the moment/i)).toBeInTheDocument()
      })

      // Should suggest checking back later
      expect(screen.getByText(/check back soon for new opportunities/i)).toBeInTheDocument()
    })

    it('should handle loading state properly', async () => {
      // Mock delayed response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({
            data: [testJobs.fullTimeJob],
            count: 1,
            error: null,
          }), 100))
        ),
      })

      renderWithProviders(<HomePage />)

      // Check for loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Loading state should be gone
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
  })

  describe('Job Filtering', () => {
    it('should filter jobs by job type', async () => {
      const user = userEvent.setup()

      // Initial mock - all jobs
      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn()

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        order: orderMock,
        eq: eqMock,
        range: rangeMock,
      })

      // First call - all jobs
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob, testJobs.partTimeJob, testJobs.contractJob],
        count: 3,
        error: null,
      })

      renderWithProviders(<HomePage />)

      // Wait for initial jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.getByText('Part-Time Designer')).toBeInTheDocument()
      })

      // Second call - filtered jobs
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob],
        count: 1,
        error: null,
      })

      // Select Full-Time filter
      const jobTypeSelect = screen.getByLabelText(/job type/i)
      await user.selectOptions(jobTypeSelect, 'Full-Time')

      // Verify filter was applied
      await waitFor(() => {
        expect(eqMock).toHaveBeenCalledWith('jobType', 'Full-Time')
      })

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.queryByText('Part-Time Designer')).not.toBeInTheDocument()
        expect(screen.queryByText('Contract Developer')).not.toBeInTheDocument()
      })
    })

    it('should filter jobs by location', async () => {
      const user = userEvent.setup()

      // Setup mocks
      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const ilikeMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn()

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        order: orderMock,
        ilike: ilikeMock,
        range: rangeMock,
      })

      // First call - all jobs
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob, testJobs.partTimeJob, testJobs.contractJob],
        count: 3,
        error: null,
      })

      renderWithProviders(<HomePage />)

      // Wait for initial jobs
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Second call - filtered by location
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob],
        count: 1,
        error: null,
      })

      // Enter location filter
      const locationInput = screen.getByPlaceholderText(/location/i)
      await user.type(locationInput, 'San Francisco')

      // Apply filter
      const applyButton = screen.getByRole('button', { name: /search/i })
      await user.click(applyButton)

      // Verify filter was applied
      await waitFor(() => {
        expect(ilikeMock).toHaveBeenCalledWith('location', '%San Francisco%')
      })

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.queryByText('Part-Time Designer')).not.toBeInTheDocument()
      })
    })

    it('should search jobs by keywords', async () => {
      const user = userEvent.setup()

      // Setup mocks
      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const orMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn()

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        order: orderMock,
        or: orMock,
        range: rangeMock,
      })

      // First call - all jobs
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob, testJobs.partTimeJob, testJobs.contractJob],
        count: 3,
        error: null,
      })

      renderWithProviders(<HomePage />)

      // Wait for initial jobs
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Second call - search results
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob],
        count: 1,
        error: null,
      })

      // Enter search query
      const searchInput = screen.getByPlaceholderText(/search jobs/i)
      await user.type(searchInput, 'software engineer')

      // Apply search
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)

      // Verify search was applied
      await waitFor(() => {
        expect(orMock).toHaveBeenCalled()
      })

      // Verify search results
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.queryByText('Part-Time Designer')).not.toBeInTheDocument()
      })
    })

    it('should clear all filters', async () => {
      const user = userEvent.setup()

      // Setup mocks for filtering
      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn()

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        order: orderMock,
        eq: eqMock,
        range: rangeMock,
      })

      // First call - all jobs
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob, testJobs.partTimeJob, testJobs.contractJob],
        count: 3,
        error: null,
      })

      renderWithProviders(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Apply filter
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob],
        count: 1,
        error: null,
      })

      const jobTypeSelect = screen.getByLabelText(/job type/i)
      await user.selectOptions(jobTypeSelect, 'Full-Time')

      await waitFor(() => {
        expect(screen.queryByText('Part-Time Designer')).not.toBeInTheDocument()
      })

      // Clear filters
      rangeMock.mockResolvedValueOnce({
        data: [testJobs.fullTimeJob, testJobs.partTimeJob, testJobs.contractJob],
        count: 3,
        error: null,
      })

      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearButton)

      // Verify all jobs are shown again
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.getByText('Part-Time Designer')).toBeInTheDocument()
        expect(screen.getByText('Contract Developer')).toBeInTheDocument()
      })
    })
  })

  describe('Job Detail View', () => {
    it('should display full job details on detail page', async () => {
      // Mock fetching single job
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: testJobs.fullTimeJob,
          error: null,
        }),
      })

      renderWithProviders(<JobDetailPage params={{ id: 'job-001' }} />)

      // Wait for job details to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Verify all job details are displayed
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText(/we are looking for a senior software engineer/i)).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('Full-Time')).toBeInTheDocument()

      // Verify apply button is present
      expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument()
    })

    it('should handle job not found', async () => {
      // Mock job not found
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Job not found',
            code: 'PGRST116',
          },
        }),
      })

      renderWithProviders(<JobDetailPage params={{ id: 'non-existent' }} />)

      // Should show not found message
      await waitFor(() => {
        expect(screen.getByText(/job not found/i)).toBeInTheDocument()
      })

      // Should show back to jobs link
      expect(screen.getByRole('link', { name: /back to jobs/i })).toBeInTheDocument()
    })

    it('should navigate from job list to job detail', async () => {
      const user = userEvent.setup()

      // Mock fetching all jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob],
          count: 1,
          error: null,
        }),
      })

      renderWithProviders(<HomePage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Click on job to view details
      const viewDetailsLink = screen.getByRole('link', { name: /view details/i })
      expect(viewDetailsLink).toHaveAttribute('href', '/jobs/job-001')
    })

    it('should show share buttons on job detail page', async () => {
      // Mock fetching single job
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: testJobs.fullTimeJob,
          error: null,
        }),
      })

      renderWithProviders(<JobDetailPage params={{ id: 'job-001' }} />)

      // Wait for job to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Verify share buttons are present
      expect(screen.getByRole('button', { name: /share on twitter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should paginate through job listings', async () => {
      const user = userEvent.setup()

      // Mock paginated results
      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn()

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        order: orderMock,
        range: rangeMock,
      })

      // First page
      rangeMock.mockResolvedValueOnce({
        data: Array(10).fill(null).map((_, i) => ({
          ...testJobs.fullTimeJob,
          id: `job-${i + 1}`,
          title: `Job ${i + 1}`,
        })),
        count: 25,
        error: null,
      })

      renderWithProviders(<HomePage />)

      // Wait for first page to load
      await waitFor(() => {
        expect(screen.getByText('Job 1')).toBeInTheDocument()
        expect(screen.getByText('Job 10')).toBeInTheDocument()
      })

      // Verify pagination info
      expect(screen.getByText(/showing 1-10 of 25/i)).toBeInTheDocument()

      // Second page
      rangeMock.mockResolvedValueOnce({
        data: Array(10).fill(null).map((_, i) => ({
          ...testJobs.fullTimeJob,
          id: `job-${i + 11}`,
          title: `Job ${i + 11}`,
        })),
        count: 25,
        error: null,
      })

      // Click next page
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Verify second page loaded
      await waitFor(() => {
        expect(screen.getByText('Job 11')).toBeInTheDocument()
        expect(screen.getByText('Job 20')).toBeInTheDocument()
      })

      // Verify first page items are not shown
      expect(screen.queryByText('Job 1')).not.toBeInTheDocument()

      // Verify updated pagination info
      expect(screen.getByText(/showing 11-20 of 25/i)).toBeInTheDocument()
    })

    it('should disable pagination buttons appropriately', async () => {
      // Mock single page of results
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob, testJobs.partTimeJob],
          count: 2,
          error: null,
        }),
      })

      renderWithProviders(<HomePage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Previous button should be disabled on first page
      const prevButton = screen.getByRole('button', { name: /previous/i })
      expect(prevButton).toBeDisabled()

      // Next button should be disabled when all items fit on one page
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Responsive Design', () => {
    it('should display jobs in grid on desktop', () => {
      // Mock desktop viewport
      global.innerWidth = 1024
      global.dispatchEvent(new Event('resize'))

      // Mock fetching jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob, testJobs.partTimeJob],
          count: 2,
          error: null,
        }),
      })

      renderWithProviders(<HomePage />)

      // Check for grid layout class
      const jobGrid = screen.getByTestId('job-grid')
      expect(jobGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('should display jobs in single column on mobile', () => {
      // Mock mobile viewport
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      // Mock fetching jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob, testJobs.partTimeJob],
          count: 2,
          error: null,
        }),
      })

      renderWithProviders(<HomePage />)

      // Check for single column layout on mobile
      const jobGrid = screen.getByTestId('job-grid')
      expect(jobGrid).toHaveClass('grid', 'grid-cols-1')
    })
  })
})