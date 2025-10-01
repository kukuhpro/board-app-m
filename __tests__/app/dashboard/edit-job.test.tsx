import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import EditJobPage from '../../../app/jobs/[id]/edit/page'
import { JobType } from '@/domain/valueObjects/JobType'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  notFound: jest.fn()
}))

// Mock auth store
jest.mock('@/stores/authStore', () => ({
  useIsAuthenticated: jest.fn()
}))

// Mock JobForm component
jest.mock('@/components/organisms', () => ({
  JobForm: jest.fn(({ mode, initialValues, onSubmit, onCancel, schema }) => (
    <div data-testid="job-form">
      <div>Mode: {mode}</div>
      <div>Title: {initialValues?.title}</div>
      <div>Company: {initialValues?.company}</div>
      <button onClick={() => onSubmit({
        title: 'Updated Job Title',
        company: 'Updated Company',
        description: 'Updated description',
        location: 'Updated Location',
        jobType: JobType.PART_TIME
      })} data-testid="submit-button">
        Submit
      </button>
      <button onClick={onCancel} data-testid="cancel-button">
        Cancel
      </button>
    </div>
  ))
}))

// Mock fetch
global.fetch = jest.fn()

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>

const mockJobData = {
  success: true,
  data: {
    job: {
      id: '1',
      title: 'Software Engineer',
      company: 'TechCorp',
      description: 'A great software engineering role',
      location: 'San Francisco, CA',
      jobType: JobType.FULL_TIME,
      userId: 'user-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    isOwner: true,
    canEdit: true
  }
}

describe('EditJobPage', () => {
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

    mockUseParams.mockReturnValue({ id: '1' })
    mockUseIsAuthenticated.mockReturnValue(true)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJobData)
    })
  })

  it('should redirect to login if not authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<EditJobPage />)

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('should render edit job form when authenticated and has permissions', async () => {
    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByText('Edit Job Posting')).toBeInTheDocument()
      expect(screen.getByText('Update the details for "Software Engineer"')).toBeInTheDocument()
      expect(screen.getByTestId('job-form')).toBeInTheDocument()
      expect(screen.getByText('Mode: edit')).toBeInTheDocument()
    })
  })

  it('should populate form with existing job data', async () => {
    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByText('Title: Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Company: TechCorp')).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    render(<EditJobPage />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should fetch job data on mount', async () => {
    render(<EditJobPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/1')
    })
  })

  it('should redirect to job detail if user cannot edit', async () => {
    const noEditJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        canEdit: false
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(noEditJobData)
    })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/jobs/1')
    })
  })

  it('should handle 404 error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    })

    const notFound = jest.fn()
    ;(require('next/navigation').notFound as jest.Mock) = notFound

    render(<EditJobPage />)

    await waitFor(() => {
      expect(notFound).toHaveBeenCalled()
    })
  })

  it('should handle 401 error and redirect to login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401
    })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should handle form submission successfully', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockJobData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '1' }
        })
      })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Updated Job Title',
          company: 'Updated Company',
          description: 'Updated description',
          location: 'Updated Location',
          jobType: JobType.PART_TIME
        })
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/jobs/1')
  })

  it('should handle form cancellation', async () => {
    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    const cancelButton = screen.getByTestId('cancel-button')
    fireEvent.click(cancelButton)

    expect(mockPush).toHaveBeenCalledWith('/jobs/1')
  })

  it('should handle 401 error during submission and redirect to login', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockJobData)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401
      })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should handle 403 error during submission and redirect to job detail', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockJobData)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403
      })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/jobs/1')
    })
  })

  it('should handle submission errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockJobData)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'Validation failed'
        })
      })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/1', expect.any(Object))
      expect(consoleSpy).toHaveBeenCalledWith('Error updating job:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should handle fetch errors during job loading', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load job details')).toBeInTheDocument()
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle non-200 responses during job loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load job details')).toBeInTheDocument()
    })
  })

  it('should show permission denied message when canEdit is false', async () => {
    const noEditJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        canEdit: false,
        isOwner: false
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(noEditJobData)
    })

    // Mock push to not actually redirect during the test
    mockPush.mockImplementation(() => {})

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByText('You don\'t have permission to edit this job')).toBeInTheDocument()
      expect(screen.getByText('← Back to Job')).toBeInTheDocument()
    })
  })

  it('should have back to job link', async () => {
    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByText('← Back to Job')).toBeInTheDocument()
    })

    const backLink = screen.getByText('← Back to Job').closest('a')
    expect(backLink).toHaveAttribute('href', '/jobs/1')
  })

  it('should display warning section', async () => {
    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByText('Important Notice')).toBeInTheDocument()
      expect(screen.getByText('Any changes you make will be immediately visible to job seekers. Make sure all information is accurate before saving your updates.')).toBeInTheDocument()
    })
  })

  it('should handle successful response without success flag', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockJobData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Update failed'
        })
      })

    render(<EditJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/1', expect.any(Object))
      expect(consoleSpy).toHaveBeenCalledWith('Error updating job:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})