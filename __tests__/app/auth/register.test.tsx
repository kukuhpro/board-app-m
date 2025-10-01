import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import RegisterPage from '../../../app/auth/register/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock auth store
jest.mock('@/stores/authStore', () => ({
  useIsAuthenticated: jest.fn()
}))

// Mock AuthForm component
jest.mock('@/components/organisms/AuthForm', () => {
  return function MockAuthForm({ mode, onSuccess }: { mode: string; onSuccess: () => void }) {
    return (
      <div data-testid="auth-form">
        <div>Mode: {mode}</div>
        <button onClick={onSuccess} data-testid="success-button">
          Submit
        </button>
      </div>
    )
  }
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>

describe('RegisterPage', () => {
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
  })

  it('should render register page when user is not authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    expect(screen.getByText('Job Board')).toBeInTheDocument()
    expect(screen.getByText('Start your journey today')).toBeInTheDocument()
    expect(screen.getByTestId('auth-form')).toBeInTheDocument()
    expect(screen.getByText('Mode: register')).toBeInTheDocument()
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    expect(screen.getByText('Sign in here')).toBeInTheDocument()
  })

  it('should show loading state when user is authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(true)

    render(<RegisterPage />)

    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()

    // Should not show register form
    expect(screen.queryByTestId('auth-form')).not.toBeInTheDocument()
  })

  it('should redirect to dashboard when user is authenticated', async () => {
    mockUseIsAuthenticated.mockReturnValue(true)

    render(<RegisterPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle successful registration', async () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    const successButton = screen.getByTestId('success-button')
    successButton.click()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should have correct link to login page', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    const loginLink = screen.getByText('Sign in here')
    expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login')
  })

  it('should have link to home page in header', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    const homeLink = screen.getByText('Job Board')
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('should apply correct styling classes', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    const container = screen.getByText('Job Board').closest('div')
    expect(container?.parentElement?.parentElement).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-green-50', 'to-emerald-100')
  })

  it('should pass correct props to AuthForm', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    expect(screen.getByText('Mode: register')).toBeInTheDocument()
  })

  it('should use emerald color scheme for links', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    const loginLink = screen.getByText('Sign in here')
    expect(loginLink).toHaveClass('text-emerald-600', 'hover:text-emerald-500')
  })

  it('should have different gradient colors than login page', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<RegisterPage />)

    const container = screen.getByText('Job Board').closest('div')
    const pageContainer = container?.parentElement?.parentElement

    expect(pageContainer).toHaveClass('from-green-50', 'to-emerald-100')
    expect(pageContainer).not.toHaveClass('from-blue-50', 'to-indigo-100')
  })
})