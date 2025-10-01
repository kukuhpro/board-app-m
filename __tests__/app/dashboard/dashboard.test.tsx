import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated, useAuthStore } from '@/stores/authStore'
import DashboardPage from '../../../app/dashboard/page'
import { JobType } from '@/domain/valueObjects/JobType'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock auth store
jest.mock('@/stores/authStore', () => ({
  useIsAuthenticated: jest.fn(),
  useAuthStore: jest.fn()
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
const mockUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

const mockUserJobsData = {
  success: true,
  data: {
    jobs: [
      {
        id: '1',
        title: 'Senior Developer',
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
        createdAt: new Date('2024-01-15')
      }
    ],
    total: 2,
    page: 1,
    totalPages: 1
  }
}

const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  createdAt: new Date('2024-01-01')
}

describe('DashboardPage', () => {
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
    mockUseAuthStore.mockReturnValue({ user: mockUser })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUserJobsData)
    })
  })

  it('should redirect to login if not authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<DashboardPage />)

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('should render dashboard header and user info', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('My Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Welcome back, user@example.com')).toBeInTheDocument()
    })
  })

  it('should fetch and display user jobs', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Senior Developer')).toBeInTheDocument()
      expect(screen.getByText('TechCorp')).toBeInTheDocument()
      expect(screen.getByText('Product Manager')).toBeInTheDocument()
      expect(screen.getByText('StartupInc')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/users/jobs?page=1&limit=12')
  })

  it('should show loading state initially', () => {
    render(<DashboardPage />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should display correct statistics', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Jobs Posted')).toBeInTheDocument()
      expect(screen.getByText('Active Listings')).toBeInTheDocument()
      expect(screen.getByText('This Month')).toBeInTheDocument()
    })

    // Check the values
    const totalJobs = screen.getAllByText('2')
    expect(totalJobs.length).toBeGreaterThan(0)
  })

  it('should show empty state when no jobs exist', async () => {
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

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('No job postings yet')).toBeInTheDocument()
      expect(screen.getByText('Get started by posting your first job opportunity. It\'s quick and easy!')).toBeInTheDocument()
      expect(screen.getByText('Post Your First Job')).toBeInTheDocument()
    })
  })

  it('should handle create job button clicks', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('+ Post New Job')).toBeInTheDocument()
    })

    const createButton = screen.getByText('+ Post New Job')
    fireEvent.click(createButton)

    expect(mockPush).toHaveBeenCalledWith('/jobs/new')
  })

  it('should handle job card clicks', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    })

    const jobCard = screen.getByText('Senior Developer').closest('[role="button"]')
    if (jobCard) {
      fireEvent.click(jobCard)
      expect(mockPush).toHaveBeenCalledWith('/jobs/1')
    }
  })

  it('should handle edit job button clicks', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Edit')[0]).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    expect(mockPush).toHaveBeenCalledWith('/jobs/1/edit')
  })

  it('should handle delete job button clicks with confirmation', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserJobsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      })

    ;(window.confirm as jest.Mock).mockReturnValue(true)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Delete')[0]).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this job? This action cannot be undone.'
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/1', {
        method: 'DELETE'
      })
    })
  })

  it('should cancel delete when confirmation is denied', async () => {
    ;(window.confirm as jest.Mock).mockReturnValue(false)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Delete')[0]).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(window.confirm).toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalledWith('/api/jobs/1', {
      method: 'DELETE'
    })
  })

  it('should handle delete errors', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserJobsData)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      })

    ;(window.confirm as jest.Mock).mockReturnValue(true)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Delete')[0]).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to delete job. Please try again.')
    })
  })

  it('should handle 401 error and redirect to login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should handle fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load your jobs')).toBeInTheDocument()
    })
  })

  it('should handle pagination', async () => {
    const paginatedData = {
      ...mockUserJobsData,
      data: {
        ...mockUserJobsData.data,
        page: 1,
        totalPages: 3
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(paginatedData)
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/jobs?page=2&limit=12')
    })
  })

  it('should show correct monthly statistics', async () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const thisMonthJob = {
      id: '3',
      title: 'This Month Job',
      company: 'CurrentCorp',
      location: 'Remote',
      jobType: JobType.CONTRACT,
      createdAt: new Date(currentYear, currentMonth, 15)
    }

    const dataWithThisMonthJob = {
      ...mockUserJobsData,
      data: {
        ...mockUserJobsData.data,
        jobs: [...mockUserJobsData.data.jobs, thisMonthJob],
        total: 3
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(dataWithThisMonthJob)
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('This Month')).toBeInTheDocument()
    })

    // Should show 1 job from this month
    const monthStats = screen.getByText('This Month').closest('div')
    expect(monthStats).toHaveTextContent('1')
  })

  it('should navigate to browse jobs page', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Browse Jobs')).toBeInTheDocument()
    })

    const browseJobsLink = screen.getByText('Browse Jobs').closest('a')
    expect(browseJobsLink).toHaveAttribute('href', '/')
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

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Post Your First Job')).toBeInTheDocument()
    })

    const postFirstJobButton = screen.getByText('Post Your First Job')
    fireEvent.click(postFirstJobButton)

    expect(mockPush).toHaveBeenCalledWith('/jobs/new')
  })
})