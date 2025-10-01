import { render, screen } from '@testing-library/react'
import NotFoundPage from '../../../app/not-found'

describe('NotFoundPage', () => {
  it('should render 404 page with correct title and message', () => {
    render(<NotFoundPage />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    expect(screen.getByText(/The page you're looking for doesn't exist/)).toBeInTheDocument()
  })

  it('should have Go Home button with correct link', () => {
    render(<NotFoundPage />)

    const goHomeButton = screen.getByText('Go Home')
    const homeLink = goHomeButton.closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should have Dashboard button with correct link', () => {
    render(<NotFoundPage />)

    const dashboardButton = screen.getByText('Dashboard')
    const dashboardLink = dashboardButton.closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  it('should display popular navigation links', () => {
    render(<NotFoundPage />)

    expect(screen.getByText('Popular Pages')).toBeInTheDocument()

    // Check for popular links
    const browseJobsLink = screen.getByText('Browse Jobs')
    expect(browseJobsLink.closest('a')).toHaveAttribute('href', '/')

    const postJobLink = screen.getByText('Post a Job')
    expect(postJobLink.closest('a')).toHaveAttribute('href', '/jobs/new')

    const signInLink = screen.getByText('Sign In')
    expect(signInLink.closest('a')).toHaveAttribute('href', '/auth/login')

    const createAccountLink = screen.getByText('Create Account')
    expect(createAccountLink.closest('a')).toHaveAttribute('href', '/auth/register')
  })

  it('should have support contact email link', () => {
    render(<NotFoundPage />)

    const supportLink = screen.getByText('Contact Support')
    expect(supportLink).toHaveAttribute('href', 'mailto:support@jobboard.com')
  })

  it('should display search suggestion section', () => {
    render(<NotFoundPage />)

    expect(screen.getByText('Looking for a specific job?')).toBeInTheDocument()
    expect(screen.getByText(/Try browsing our/)).toBeInTheDocument()

    const jobListingsLink = screen.getByText('job listings')
    expect(jobListingsLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('should display brand footer', () => {
    render(<NotFoundPage />)

    expect(screen.getByText('Job Board - Building careers, connecting opportunities')).toBeInTheDocument()
  })

  it('should have proper 404 icon', () => {
    render(<NotFoundPage />)

    const icon = document.querySelector('.text-blue-600')
    expect(icon).toBeInTheDocument()
  })

  it('should have info icon in search suggestion', () => {
    render(<NotFoundPage />)

    const infoIcon = document.querySelector('.text-blue-400')
    expect(infoIcon).toBeInTheDocument()
  })

  it('should be accessible with proper heading hierarchy', () => {
    render(<NotFoundPage />)

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('404')

    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2).toHaveTextContent('Page Not Found')

    const h3Elements = screen.getAllByRole('heading', { level: 3 })
    expect(h3Elements).toHaveLength(2)
    expect(h3Elements[0]).toHaveTextContent('Popular Pages')
    expect(h3Elements[1]).toHaveTextContent('Looking for a specific job?')
  })

  it('should have proper button styling', () => {
    render(<NotFoundPage />)

    const goHomeButton = screen.getByText('Go Home')
    const dashboardButton = screen.getByText('Dashboard')

    expect(goHomeButton).toHaveClass('w-full')
    expect(dashboardButton).toHaveClass('w-full')
  })
})