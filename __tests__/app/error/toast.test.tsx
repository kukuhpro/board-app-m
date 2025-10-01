import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Toast } from '@/components/atoms'
import { ToastProvider, useToast } from '@/contexts/ToastContext'
import { useToastNotification } from '@/hooks/useToastNotification'

const mockOnClose = jest.fn()

const TestToastComponent = ({ testFunction }: { testFunction: () => void }) => {
  return (
    <button onClick={testFunction} data-testid="trigger-toast">
      Trigger Toast
    </button>
  )
}

const ToastTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
)

describe('Toast Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render success toast correctly', () => {
    render(
      <Toast
        id="test-1"
        type="success"
        title="Success Message"
        message="Operation completed successfully"
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Success Message')).toBeInTheDocument()
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
    expect(document.querySelector('.border-green-200')).toBeInTheDocument()
  })

  it('should render error toast correctly', () => {
    render(
      <Toast
        id="test-2"
        type="error"
        title="Error Message"
        message="Something went wrong"
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Error Message')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(document.querySelector('.border-red-200')).toBeInTheDocument()
  })

  it('should render warning toast correctly', () => {
    render(
      <Toast
        id="test-3"
        type="warning"
        title="Warning Message"
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Warning Message')).toBeInTheDocument()
    expect(document.querySelector('.border-yellow-200')).toBeInTheDocument()
  })

  it('should render info toast correctly', () => {
    render(
      <Toast
        id="test-4"
        type="info"
        title="Info Message"
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Info Message')).toBeInTheDocument()
    expect(document.querySelector('.border-blue-200')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <Toast
        id="test-5"
        type="success"
        title="Test Toast"
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledWith('test-5')
  })

  it('should render without message', () => {
    render(
      <Toast
        id="test-6"
        type="info"
        title="Title Only"
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Title Only')).toBeInTheDocument()
    expect(screen.queryByText('Operation completed successfully')).not.toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <Toast
        id="test-7"
        type="success"
        title="Accessible Toast"
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByRole('button')
    expect(closeButton).toHaveAttribute('aria-label')

    const srText = screen.getByText('Close')
    expect(srText).toHaveClass('sr-only')
  })
})

describe('ToastContext and Provider', () => {
  it('should provide toast functionality through context', () => {
    const TestComponent = () => {
      const { showToast } = useToast()

      return (
        <button
          onClick={() => showToast('success', 'Test Toast')}
          data-testid="show-toast"
        >
          Show Toast
        </button>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    const button = screen.getByTestId('show-toast')
    fireEvent.click(button)

    expect(screen.getByText('Test Toast')).toBeInTheDocument()
  })

  it('should auto-hide toast after duration', async () => {
    const TestComponent = () => {
      const { showToast } = useToast()

      return (
        <button
          onClick={() => showToast('info', 'Auto Hide Toast', undefined, 100)}
          data-testid="auto-hide-toast"
        >
          Show Auto Hide Toast
        </button>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    const button = screen.getByTestId('auto-hide-toast')
    fireEvent.click(button)

    expect(screen.getByText('Auto Hide Toast')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Auto Hide Toast')).not.toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('should allow multiple toasts', () => {
    const TestComponent = () => {
      const { showToast } = useToast()

      return (
        <div>
          <button
            onClick={() => showToast('success', 'First Toast')}
            data-testid="first-toast"
          >
            First Toast
          </button>
          <button
            onClick={() => showToast('error', 'Second Toast')}
            data-testid="second-toast"
          >
            Second Toast
          </button>
        </div>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    fireEvent.click(screen.getByTestId('first-toast'))
    fireEvent.click(screen.getByTestId('second-toast'))

    const firstToasts = screen.getAllByText('First Toast')
    const secondToasts = screen.getAllByText('Second Toast')
    expect(firstToasts.length).toBeGreaterThan(0)
    expect(secondToasts.length).toBeGreaterThan(0)
  })

  it('should clear all toasts', () => {
    const TestComponent = () => {
      const { showToast, clearAllToasts } = useToast()

      return (
        <div>
          <button
            onClick={() => showToast('success', 'Toast 1')}
            data-testid="toast-1"
          >
            Toast 1
          </button>
          <button
            onClick={() => showToast('error', 'Toast 2')}
            data-testid="toast-2"
          >
            Toast 2
          </button>
          <button
            onClick={clearAllToasts}
            data-testid="clear-all"
          >
            Clear All
          </button>
        </div>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    fireEvent.click(screen.getByTestId('toast-1'))
    fireEvent.click(screen.getByTestId('toast-2'))

    expect(screen.getAllByText('Toast 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Toast 2').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('clear-all'))

    // Wait for toast container to be removed after clearing
    expect(screen.queryByText((content, element) => {
      return element?.tagName !== 'BUTTON' && content === 'Toast 1'
    })).not.toBeInTheDocument()
    expect(screen.queryByText((content, element) => {
      return element?.tagName !== 'BUTTON' && content === 'Toast 2'
    })).not.toBeInTheDocument()
  })
})

describe('useToastNotification Hook', () => {
  it('should provide convenience methods for different toast types', () => {
    const TestComponent = () => {
      const toast = useToastNotification()

      return (
        <div>
          <button onClick={() => toast.success('Success!')} data-testid="success">Success</button>
          <button onClick={() => toast.error('Error!')} data-testid="error">Error</button>
          <button onClick={() => toast.warning('Warning!')} data-testid="warning">Warning</button>
          <button onClick={() => toast.info('Info!')} data-testid="info">Info</button>
        </div>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    fireEvent.click(screen.getByTestId('success'))
    expect(screen.getByText('Success!')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('error'))
    expect(screen.getByText('Error!')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('warning'))
    expect(screen.getByText('Warning!')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('info'))
    expect(screen.getByText('Info!')).toBeInTheDocument()
  })

  it('should provide job-specific convenience methods', () => {
    const TestComponent = () => {
      const toast = useToastNotification()

      return (
        <div>
          <button onClick={() => toast.jobCreated()} data-testid="job-created">Job Created</button>
          <button onClick={() => toast.jobUpdated()} data-testid="job-updated">Job Updated</button>
          <button onClick={() => toast.jobDeleted()} data-testid="job-deleted">Job Deleted</button>
        </div>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    fireEvent.click(screen.getByTestId('job-created'))
    expect(screen.getAllByText('Job Created').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('job-updated'))
    expect(screen.getAllByText('Job Updated').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('job-deleted'))
    expect(screen.getAllByText('Job Deleted').length).toBeGreaterThan(0)
  })

  it('should provide auth-specific convenience methods', () => {
    const TestComponent = () => {
      const toast = useToastNotification()

      return (
        <div>
          <button onClick={() => toast.authSuccess('login')} data-testid="auth-login">Login</button>
          <button onClick={() => toast.authSuccess('register')} data-testid="auth-register">Register</button>
          <button onClick={() => toast.authSuccess('logout')} data-testid="auth-logout">Logout</button>
        </div>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    fireEvent.click(screen.getByTestId('auth-login'))
    expect(screen.getByText('Logged In')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('auth-register'))
    expect(screen.getByText('Account Created')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('auth-logout'))
    expect(screen.getByText('Logged Out')).toBeInTheDocument()
  })

  it('should provide error convenience methods', () => {
    const TestComponent = () => {
      const toast = useToastNotification()

      return (
        <div>
          <button onClick={() => toast.networkError()} data-testid="network-error">Network Error</button>
          <button onClick={() => toast.permissionError()} data-testid="permission-error">Permission Error</button>
          <button onClick={() => toast.notFoundError('Job')} data-testid="not-found-error">Not Found Error</button>
        </div>
      )
    }

    render(
      <ToastTestWrapper>
        <TestComponent />
      </ToastTestWrapper>
    )

    fireEvent.click(screen.getByTestId('network-error'))
    expect(screen.getAllByText('Network Error').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('permission-error'))
    expect(screen.getAllByText('Permission Denied').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('not-found-error'))
    expect(screen.getAllByText('Not Found').length).toBeGreaterThan(0)
    expect(screen.getByText(/Job not found/)).toBeInTheDocument()
  })
})