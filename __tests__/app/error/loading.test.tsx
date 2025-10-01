import { render, screen } from '@testing-library/react'
import LoadingPage from '../../../app/loading'

describe('LoadingPage', () => {
  it('should render loading page with brand title', () => {
    render(<LoadingPage />)

    expect(screen.getByText('Job Board')).toBeInTheDocument()
    expect(screen.getByText('Building careers, connecting opportunities')).toBeInTheDocument()
  })

  it('should display loading text', () => {
    render(<LoadingPage />)

    const loadingTexts = screen.getAllByText('Loading...')
    expect(loadingTexts.length).toBeGreaterThan(0)
    expect(screen.getByText('Please wait while we prepare your content')).toBeInTheDocument()
  })

  it('should display loading spinner', () => {
    render(<LoadingPage />)

    // The LoadingSpinner component should be rendered
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should have animated dots', () => {
    render(<LoadingPage />)

    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('should display progress bar', () => {
    render(<LoadingPage />)

    const progressBar = document.querySelector('.bg-gradient-to-r')
    expect(progressBar).toBeInTheDocument()
  })

  it('should display skeleton content', () => {
    render(<LoadingPage />)

    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)

    // Check for skeleton grid
    const skeletonGrid = document.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3')
    expect(skeletonGrid).toBeInTheDocument()
  })

  it('should display footer text', () => {
    render(<LoadingPage />)

    expect(screen.getByText('Powered by Next.js and Supabase')).toBeInTheDocument()
  })

  it('should have proper layout structure', () => {
    render(<LoadingPage />)

    const container = document.querySelector('.min-h-screen')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('bg-gray-50', 'flex', 'flex-col', 'justify-center', 'items-center')
  })

  it('should have skeleton cards with correct structure', () => {
    render(<LoadingPage />)

    // Should have 6 skeleton cards based on the array
    const skeletonCards = document.querySelectorAll('.border.border-gray-200.rounded-lg.p-4')
    expect(skeletonCards).toHaveLength(6)

    // Each card should have skeleton elements
    skeletonCards.forEach(card => {
      const skeletonBars = card.querySelectorAll('.bg-gray-200.rounded')
      expect(skeletonBars.length).toBeGreaterThan(0)
    })
  })

  it('should have animated progress bar', () => {
    render(<LoadingPage />)

    const progressContainer = document.querySelector('.bg-gray-200.rounded-full.h-2')
    expect(progressContainer).toBeInTheDocument()

    const progressBar = document.querySelector('.bg-gradient-to-r.from-blue-500.to-blue-600')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveClass('animate-pulse')
  })

  it('should have proper responsive classes', () => {
    render(<LoadingPage />)

    const responsiveGrid = document.querySelector('.md\\:grid-cols-2')
    expect(responsiveGrid).toBeInTheDocument()

    const responsivePadding = document.querySelector('.sm\\:px-6')
    expect(responsivePadding).toBeInTheDocument()
  })

  it('should maintain accessibility with proper structure', () => {
    render(<LoadingPage />)

    // Should have a main heading
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Job Board')

    // Should have descriptive text
    expect(screen.getByText('Please wait while we prepare your content')).toBeInTheDocument()
  })

  it('should have staggered animation delays for dots', () => {
    render(<LoadingPage />)

    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots[0]).not.toHaveStyle('animation-delay: 0.1s')
    expect(dots[1]).toHaveStyle('animation-delay: 0.1s')
    expect(dots[2]).toHaveStyle('animation-delay: 0.2s')
  })
})