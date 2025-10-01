import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import LoginPage from '../../../app/auth/login/page'

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

describe('LoginPage', () => {
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

  it('should render login page when user is not authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<LoginPage />)

    expect(screen.getByText('Job Board')).toBeInTheDocument()
    expect(screen.getByText('Find your next opportunity')).toBeInTheDocument()
    expect(screen.getByTestId('auth-form')).toBeInTheDocument()
    expect(screen.getByText('Mode: login')).toBeInTheDocument()
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    expect(screen.getByText('Sign up for free')).toBeInTheDocument()
  })

  it('should show loading state when user is authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue(true)

    render(<LoginPage />)

    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()

    // Should not show login form
    expect(screen.queryByTestId('auth-form')).not.toBeInTheDocument()
  })

  it('should redirect to dashboard when user is authenticated', async () => {
    mockUseIsAuthenticated.mockReturnValue(true)

    render(<LoginPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle successful authentication', async () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<LoginPage />)

    const successButton = screen.getByTestId('success-button')
    successButton.click()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should have correct link to register page', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<LoginPage />)

    const registerLink = screen.getByText('Sign up for free')
    expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register')
  })

  it('should have link to home page in header', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<LoginPage />)

    const homeLink = screen.getByText('Job Board')
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('should apply correct styling classes', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<LoginPage />)

    const container = screen.getByText('Job Board').closest('div')
    expect(container?.parentElement?.parentElement).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-blue-50', 'to-indigo-100')
  })

  it('should pass correct props to AuthForm', () => {
    mockUseIsAuthenticated.mockReturnValue(false)

    render(<LoginPage />)

    expect(screen.getByText('Mode: login')).toBeInTheDocument()
  })
})