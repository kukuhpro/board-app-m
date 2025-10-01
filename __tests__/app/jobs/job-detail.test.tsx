import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import JobDetailPage from '../../../app/jobs/[id]/page'
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

// Mock fetch
global.fetch = jest.fn()

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
  writable: true
})

// Mock window.alert
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>

const mockJobData = {
  success: true,
  data: {
    job: {
      id: '1',
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      description: 'We are looking for a talented software engineer to join our team. You will be responsible for developing high-quality software solutions and working with cross-functional teams to deliver exceptional products.',
      location: 'San Francisco, CA',
      jobType: JobType.FULL_TIME,
      userId: 'user-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    isOwner: false,
    canEdit: false
  }
}

describe('JobDetailPage', () => {
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
    mockUseIsAuthenticated.mockReturnValue(false)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJobData)
    })
  })

  it('should render job details correctly', async () => {
    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('TechCorp Inc.')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('Full-Time')).toBeInTheDocument()
      expect(screen.getByText('Posted on January 1, 2024')).toBeInTheDocument()
    })

    expect(screen.getByText(/We are looking for a talented software engineer/)).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    render(<JobDetailPage />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should fetch job data on mount', async () => {
    render(<JobDetailPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/1')
    })
  })

  it('should show back to jobs button', async () => {
    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('← Back to Jobs')).toBeInTheDocument()
    })

    const backButton = screen.getByText('← Back to Jobs')
    expect(backButton.closest('a')).toHaveAttribute('href', '/')
  })

  it('should show owner actions when user is owner', async () => {
    const ownerJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        isOwner: true,
        canEdit: true
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(ownerJobData)
    })

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Edit Job')).toBeInTheDocument()
      expect(screen.getByText('Delete Job')).toBeInTheDocument()
    })
  })

  it('should handle edit button click', async () => {
    const ownerJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        isOwner: true,
        canEdit: true
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(ownerJobData)
    })

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Edit Job')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit Job')
    fireEvent.click(editButton)

    expect(mockPush).toHaveBeenCalledWith('/jobs/1/edit')
  })

  it('should handle delete button click with confirmation', async () => {
    const ownerJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        isOwner: true,
        canEdit: true
      }
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(ownerJobData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      })

    ;(window.confirm as jest.Mock).mockReturnValue(true)

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Delete Job')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete Job')
    fireEvent.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this job? This action cannot be undone.'
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/1', {
        method: 'DELETE'
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should cancel delete when confirmation is denied', async () => {
    const ownerJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        isOwner: true,
        canEdit: true
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(ownerJobData)
    })

    ;(window.confirm as jest.Mock).mockReturnValue(false)

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Delete Job')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete Job')
    fireEvent.click(deleteButton)

    expect(window.confirm).toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalledWith('/api/jobs/1', {
      method: 'DELETE'
    })
  })

  it('should show call to action for unauthenticated users', async () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Interested in this position?')).toBeInTheDocument()
      expect(screen.getByText('Contact TechCorp Inc. directly to apply for this job opportunity.')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })
  })

  it('should show different call to action for authenticated non-owner users', async () => {
    mockUseIsAuthenticated.mockReturnValue(true)

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Interested in this position?')).toBeInTheDocument()
      expect(screen.getByText('Contact TechCorp Inc. directly to apply for this job opportunity.')).toBeInTheDocument()
    })

    // Should not show sign in/register buttons for authenticated users
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('Create Account')).not.toBeInTheDocument()
  })

  it('should handle 404 error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    })

    const notFound = jest.fn()
    ;(require('next/navigation').notFound as jest.Mock) = notFound

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(notFound).toHaveBeenCalled()
    })
  })

  it('should handle fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load job details')).toBeInTheDocument()
      expect(screen.getByText('← Back to Job Listings')).toBeInTheDocument()
    })
  })

  it('should handle non-200 responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    })

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load job details')).toBeInTheDocument()
    })
  })

  it('should show updated date when job was modified', async () => {
    const updatedJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        job: {
          ...mockJobData.data.job,
          updatedAt: new Date('2024-01-15')
        }
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(updatedJobData)
    })

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Last updated on January 15, 2024')).toBeInTheDocument()
    })
  })

  it('should handle delete errors', async () => {
    const ownerJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        isOwner: true,
        canEdit: true
      }
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(ownerJobData)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      })

    ;(window.confirm as jest.Mock).mockReturnValue(true)

    render(<JobDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Delete Job')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete Job')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to delete job. Please try again.')
    })
  })

  it('should format different job types with correct badge colors', async () => {
    const contractJobData = {
      ...mockJobData,
      data: {
        ...mockJobData.data,
        job: {
          ...mockJobData.data.job,
          jobType: JobType.CONTRACT
        }
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(contractJobData)
    })

    render(<JobDetailPage />)

    await waitFor(() => {
      const badge = screen.getByText('Contract')
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800', 'border-purple-200')
    })
  })
})