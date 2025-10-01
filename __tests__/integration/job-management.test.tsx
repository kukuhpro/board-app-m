import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CreateJobPage from '../../app/jobs/new/page'
import EditJobPage from '../../app/jobs/[id]/edit/page'
import DashboardPage from '../../app/dashboard/page'
import {
  renderWithProviders,
  mockSupabaseClient,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  testUsers,
  testJobs,
  fillJobForm,
  waitForLoadingToFinish
} from './test-utils'

// Mock the router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/jobs/new',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the Supabase client
jest.mock('../../src/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('Job Management Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthenticatedUser(testUsers.employer)
  })

  describe('Create Job Flow', () => {
    it('should successfully create a new job posting', async () => {
      const user = userEvent.setup()

      // Mock successful job creation
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...testJobs.fullTimeJob,
            id: 'new-job-id',
            createdAt: new Date().toISOString(),
          },
          error: null,
        }),
      })

      renderWithProviders(<CreateJobPage />)

      // Wait for form to load
      await waitForLoadingToFinish()

      // Fill in job form
      await fillJobForm(user, {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        description: 'We are looking for a senior software engineer to join our team.',
        location: 'San Francisco, CA',
        jobType: 'Full-Time',
      })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /post job/i })
      await user.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalled()
      })

      // Verify redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })

      // Verify success message
      expect(screen.getByText(/job posted successfully/i)).toBeInTheDocument()
    })

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup()

      renderWithProviders(<CreateJobPage />)

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /post job/i })
      await user.click(submitButton)

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/company is required/i)).toBeInTheDocument()
        expect(screen.getByText(/description is required/i)).toBeInTheDocument()
        expect(screen.getByText(/location is required/i)).toBeInTheDocument()
      })

      // Verify no API call was made
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should handle job creation errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock job creation failure
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Database error',
            code: 'P0001',
          },
        }),
      })

      renderWithProviders(<CreateJobPage />)

      // Fill and submit form
      await fillJobForm(user, testJobs.fullTimeJob)

      const submitButton = screen.getByRole('button', { name: /post job/i })
      await user.click(submitButton)

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create job/i)).toBeInTheDocument()
      })

      // Verify no redirect occurred
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should require authentication to access create job page', async () => {
      mockUnauthenticatedUser()

      renderWithProviders(<CreateJobPage />)

      // Should redirect to login
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()

      // Mock delayed response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({
            data: testJobs.fullTimeJob,
            error: null,
          }), 100))
        ),
      })

      renderWithProviders(<CreateJobPage />)

      await fillJobForm(user, testJobs.fullTimeJob)

      const submitButton = screen.getByRole('button', { name: /post job/i })
      await user.click(submitButton)

      // Check for loading state
      expect(screen.getByRole('button', { name: /posting/i })).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Edit Job Flow', () => {
    it('should successfully edit an existing job', async () => {
      const user = userEvent.setup()

      // Mock fetching existing job
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: testJobs.fullTimeJob,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      })

      // Mock job update
      const updateMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: { ...testJobs.fullTimeJob, title: 'Updated Title' },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'jobs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: testJobs.fullTimeJob,
              error: null,
            }),
            update: updateMock,
          }
        }
        return mockSupabaseClient.from(table)
      })

      updateMock.mockReturnValue({
        eq: eqMock,
      })

      eqMock.mockReturnValue({
        single: singleMock,
      })

      renderWithProviders(<EditJobPage params={{ id: 'job-001' }} />)

      // Wait for existing data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Senior Software Engineer')).toBeInTheDocument()
      })

      // Clear and update title
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update job/i })
      await user.click(submitButton)

      // Verify update API call
      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled()
        expect(eqMock).toHaveBeenCalledWith('id', 'job-001')
      })

      // Verify redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should prevent editing jobs not owned by user', async () => {
      // Mock fetching job owned by different user
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...testJobs.fullTimeJob, userId: 'different-user-id' },
          error: null,
        }),
      })

      renderWithProviders(<EditJobPage params={{ id: 'job-001' }} />)

      // Should show unauthorized message
      await waitFor(() => {
        expect(screen.getByText(/not authorized to edit this job/i)).toBeInTheDocument()
      })

      // Should not show edit form
      expect(screen.queryByRole('button', { name: /update job/i })).not.toBeInTheDocument()
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

      renderWithProviders(<EditJobPage params={{ id: 'non-existent' }} />)

      // Should show not found message
      await waitFor(() => {
        expect(screen.getByText(/job not found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Delete Job Flow', () => {
    it('should successfully delete a job', async () => {
      const user = userEvent.setup()

      // Mock fetching user's jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob, testJobs.partTimeJob],
          count: 2,
          error: null,
        }),
        delete: jest.fn().mockReturnThis(),
      })

      // Mock delete operation
      const deleteMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'jobs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: [testJobs.fullTimeJob, testJobs.partTimeJob],
              count: 2,
              error: null,
            }),
            delete: deleteMock,
          }
        }
        return mockSupabaseClient.from(table)
      })

      deleteMock.mockReturnValue({
        eq: eqMock,
      })

      renderWithProviders(<DashboardPage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Find delete button for first job
      const jobCards = screen.getAllByTestId('job-card')
      const firstJobCard = jobCards[0]
      const deleteButton = within(firstJobCard).getByRole('button', { name: /delete/i })

      await user.click(deleteButton)

      // Confirm deletion in modal
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      // Verify delete API call
      await waitFor(() => {
        expect(deleteMock).toHaveBeenCalled()
        expect(eqMock).toHaveBeenCalledWith('id', 'job-001')
      })

      // Verify success message
      expect(screen.getByText(/job deleted successfully/i)).toBeInTheDocument()
    })

    it('should show confirmation dialog before deletion', async () => {
      const user = userEvent.setup()

      // Mock fetching user's jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob],
          count: 1,
          error: null,
        }),
      })

      renderWithProviders(<DashboardPage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Check confirmation dialog appears
      expect(screen.getByText(/are you sure you want to delete this job/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument()
    })

    it('should handle delete errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock fetching user's jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob],
          count: 1,
          error: null,
        }),
        delete: jest.fn().mockReturnThis(),
      })

      // Mock delete failure
      const deleteMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Cannot delete job with active applications',
          code: 'P0002',
        },
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'jobs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: [testJobs.fullTimeJob],
              count: 1,
              error: null,
            }),
            delete: deleteMock,
          }
        }
        return mockSupabaseClient.from(table)
      })

      deleteMock.mockReturnValue({
        eq: eqMock,
      })

      renderWithProviders(<DashboardPage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Delete job
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/cannot delete job with active applications/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Job Management', () => {
    it('should display all user jobs in dashboard', async () => {
      // Mock fetching user's jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob, testJobs.partTimeJob],
          count: 2,
          error: null,
        }),
      })

      renderWithProviders(<DashboardPage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.getByText('Part-Time Designer')).toBeInTheDocument()
      })

      // Verify job details are displayed
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('Design Studio')).toBeInTheDocument()
    })

    it('should show empty state when no jobs exist', async () => {
      // Mock empty job list
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      })

      renderWithProviders(<DashboardPage />)

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText(/no jobs posted yet/i)).toBeInTheDocument()
      })

      // Should show create job button
      expect(screen.getByRole('link', { name: /post your first job/i })).toBeInTheDocument()
    })

    it('should navigate to edit page when edit button is clicked', async () => {
      const user = userEvent.setup()

      // Mock fetching user's jobs
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [testJobs.fullTimeJob],
          count: 1,
          error: null,
        }),
      })

      renderWithProviders(<DashboardPage />)

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      })

      // Click edit button
      const editButton = screen.getByRole('link', { name: /edit/i })
      expect(editButton).toHaveAttribute('href', '/jobs/job-001/edit')
    })
  })
})