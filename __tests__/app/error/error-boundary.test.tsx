import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from '../../../app/error'

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

const mockReset = jest.fn()

const createMockError = (message: string, digest?: string) => {
  const error = new Error(message) as Error & { digest?: string }
  if (digest) {
    error.digest = digest
  }
  return error
}

describe('ErrorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render error page with basic error message', () => {
    const error = createMockError('Test error message')

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })

  it('should call reset function when Try Again button is clicked', () => {
    const error = createMockError('Test error message')

    render(<ErrorPage error={error} reset={mockReset} />)

    const tryAgainButton = screen.getByText('Try Again')
    fireEvent.click(tryAgainButton)

    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('should have correct link to home page', () => {
    const error = createMockError('Test error message')

    render(<ErrorPage error={error} reset={mockReset} />)

    const homeLink = screen.getByText('Go Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should log error to console on mount', () => {
    const error = createMockError('Test error message')
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(consoleSpy).toHaveBeenCalledWith('Application error:', error)

    consoleSpy.mockRestore()
  })

  it('should display error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const error = createMockError('Detailed error message')
    error.stack = 'Error: Detailed error message\n    at Component\n    at render'

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.getByText('Error:')).toBeInTheDocument()
    expect(screen.getByText('Detailed error message')).toBeInTheDocument()
    expect(screen.getByText('Stack Trace:')).toBeInTheDocument()
    expect(screen.getByText(/Error: Detailed error message/)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should display error digest when provided in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const error = createMockError('Test error message', 'abc123digest')

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.getByText('Digest:')).toBeInTheDocument()
    const digestElements = screen.getAllByText((content, node) => {
      return content.includes('abc123digest')
    })
    expect(digestElements.length).toBeGreaterThan(0)

    process.env.NODE_ENV = originalEnv
  })

  it('should hide error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const error = createMockError('Detailed error message')
    error.stack = 'Error: Detailed error message\n    at Component\n    at render'

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.queryByText('Error:')).not.toBeInTheDocument()
    expect(screen.queryByText('Detailed error message')).not.toBeInTheDocument()
    expect(screen.queryByText('Stack Trace:')).not.toBeInTheDocument()
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should display error digest in support contact in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const error = createMockError('Test error message', 'abc123digest')

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.getByText(/with error ID: abc123digest/)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should have support contact email link', () => {
    const error = createMockError('Test error message')

    render(<ErrorPage error={error} reset={mockReset} />)

    const supportLink = screen.getByText('contact support')
    expect(supportLink).toHaveAttribute('href', 'mailto:support@jobboard.com')
  })

  it('should display brand footer', () => {
    const error = createMockError('Test error message')

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.getByText('Job Board - Building careers, connecting opportunities')).toBeInTheDocument()
  })

  it('should have proper error icon', () => {
    const error = createMockError('Test error message')

    render(<ErrorPage error={error} reset={mockReset} />)

    const errorIcon = document.querySelector('.text-red-600')
    expect(errorIcon).toBeInTheDocument()
  })

  it('should handle error without digest', () => {
    const error = createMockError('Test error message')

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.queryByText('Digest:')).not.toBeInTheDocument()
    expect(screen.queryByText(/with error ID:/)).not.toBeInTheDocument()
  })

  it('should handle error without stack trace', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const error = createMockError('Test error message')
    // Explicitly set stack to undefined
    error.stack = undefined

    render(<ErrorPage error={error} reset={mockReset} />)

    expect(screen.queryByText('Stack Trace:')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})