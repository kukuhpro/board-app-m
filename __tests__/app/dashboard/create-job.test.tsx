import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import CreateJobPage from '../../../app/jobs/new/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock auth store
jest.mock('@/stores/authStore', () => ({
  useIsAuthenticated: jest.fn()
}))

// Mock JobForm component
jest.mock('@/components/organisms', () => ({
  JobForm: jest.fn(({ mode, onSubmit, onCancel, schema }) => (
    <div data-testid="job-form">
      <div>Mode: {mode}</div>
      <button onClick={() => onSubmit({
        title: 'Test Job',
        company: 'Test Company',
        description: 'Test description',
        location: 'Test Location',
        jobType: 'Full-Time'
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
const mockUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>

describe('CreateJobPage', () => {
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

    mockUseIsAuthenticated.mockReturnValue(true)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: { id: 'new-job-id' }
      })
    })
  })

  it('should redirect to login if not authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<CreateJobPage />)

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('should render create job form when authenticated', async () => {
    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByText('Post a New Job')).toBeInTheDocument()
      expect(screen.getByText('Fill out the details below to create your job posting')).toBeInTheDocument()
      expect(screen.getByTestId('job-form')).toBeInTheDocument()
      expect(screen.getByText('Mode: create')).toBeInTheDocument()
    })
  })

  it('should show loading state when not authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<CreateJobPage />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should have back to dashboard link', async () => {
    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument()
    })

    const backLink = screen.getByText('← Back to Dashboard').closest('a')
    expect(backLink).toHaveAttribute('href', '/dashboard')
  })

  it('should handle form submission successfully', async () => {
    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Job',
          company: 'Test Company',
          description: 'Test description',
          location: 'Test Location',
          jobType: 'Full-Time'
        })
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/jobs/new-job-id')
  })

  it('should handle form cancellation', async () => {
    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    const cancelButton = screen.getByTestId('cancel-button')
    fireEvent.click(cancelButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should handle 401 error and redirect to login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401
    })

    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should handle submission errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: 'Validation failed'
      })
    })

    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Error creating job:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should handle network errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Error creating job:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should display tips section', async () => {
    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByText('Tips for writing a great job posting')).toBeInTheDocument()
      expect(screen.getByText('Write a clear, descriptive job title that accurately reflects the role')).toBeInTheDocument()
      expect(screen.getByText('Include specific requirements, skills, and qualifications needed')).toBeInTheDocument()
      expect(screen.getByText('Describe the company culture and what makes your workplace unique')).toBeInTheDocument()
      expect(screen.getByText('Be specific about the location, especially if remote work is available')).toBeInTheDocument()
      expect(screen.getByText('Proofread your posting for grammar and spelling errors')).toBeInTheDocument()
    })
  })

  it('should handle successful response without data.id', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: false,
        error: 'Something went wrong'
      })
    })

    render(<CreateJobPage />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Error creating job:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})