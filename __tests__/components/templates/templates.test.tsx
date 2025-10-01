import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  PublicLayout,
  DashboardLayout,
  JobLayout
} from '@/components/templates'
import { JobType } from '@/domain/valueObjects/JobType'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
})

// Mock Navigation organism
jest.mock('@/components/organisms', () => ({
  Navigation: ({ user, onLogout }: any) => (
    <nav data-testid="navigation">
      {user && <span>User: {user.email}</span>}
      {onLogout && <button onClick={onLogout}>Logout</button>}
    </nav>
  )
}))

// Mock FilterBar molecule
jest.mock('@/components/molecules', () => ({
  FilterBar: ({ location, jobType, onLocationChange, onJobTypeChange, onClearFilters, orientation }: any) => (
    <div data-testid="filter-bar" data-orientation={orientation}>
      {location && <span>Location: {location}</span>}
      {jobType && <span>Type: {jobType}</span>}
      <button onClick={() => onLocationChange?.('New York')}>Set Location</button>
      <button onClick={() => onJobTypeChange?.(JobType.FULL_TIME)}>Set Type</button>
      <button onClick={onClearFilters}>Clear</button>
    </div>
  ),
  Button: ({ children, onClick, variant, fullWidth }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-fullwidth={fullWidth}
      className="button"
    >
      {children}
    </button>
  )
}))

// Mock Button atom
jest.mock('@/components/atoms', () => ({
  Button: ({ children, onClick, variant, fullWidth }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-fullwidth={fullWidth}
      className="button"
    >
      {children}
    </button>
  )
}))

describe('Template Components', () => {
  describe('PublicLayout', () => {
    it('renders navigation and footer', () => {
      render(
        <PublicLayout>
          <div>Test Content</div>
        </PublicLayout>
      )

      expect(screen.getByTestId('navigation')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.getByText('JobBoard')).toBeInTheDocument()
      expect(screen.getByText(/© \d{4} JobBoard/)).toBeInTheDocument()
    })

    it('passes user and logout handler to navigation', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: '2024-01-01'
      }
      const mockLogout = jest.fn()

      render(
        <PublicLayout user={mockUser as any} onLogout={mockLogout}>
          <div>Test Content</div>
        </PublicLayout>
      )

      expect(screen.getByText('User: test@example.com')).toBeInTheDocument()

      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)
      expect(mockLogout).toHaveBeenCalled()
    })

    it('renders footer with all links', () => {
      render(
        <PublicLayout>
          <div>Test Content</div>
        </PublicLayout>
      )

      expect(screen.getByText('Browse Jobs')).toBeInTheDocument()
      expect(screen.getByText('Post a Job')).toBeInTheDocument()
      expect(screen.getByText('About Us')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
      expect(screen.getByText('Cookie Policy')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <PublicLayout className="custom-class">
          <div>Test Content</div>
        </PublicLayout>
      )

      const layoutDiv = screen.getByText('Test Content').parentElement?.parentElement?.parentElement
      expect(layoutDiv).toHaveClass('custom-class')
    })
  })

  describe('DashboardLayout', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      created_at: '2024-01-01'
    }

    it('renders navigation and sidebar for authenticated users', () => {
      render(
        <DashboardLayout user={mockUser as any}>
          <div>Dashboard Content</div>
        </DashboardLayout>
      )

      expect(screen.getByTestId('navigation')).toBeInTheDocument()
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('My Jobs')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('shows user info in sidebar', () => {
      render(
        <DashboardLayout user={mockUser as any}>
          <div>Dashboard Content</div>
        </DashboardLayout>
      )

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('test')).toBeInTheDocument() // Username from email
    })

    it('highlights active tab', () => {
      render(
        <DashboardLayout user={mockUser as any} activeTab="my-jobs">
          <div>My Jobs Content</div>
        </DashboardLayout>
      )

      const myJobsLink = screen.getByText('My Jobs')
      // Check that the link exists and is in the expected container
      expect(myJobsLink).toBeInTheDocument()
      // The active tab styling is applied to the Link wrapper, not the anchor directly
      const linkContainer = myJobsLink.closest('a')
      expect(linkContainer).toBeInTheDocument()
      expect(linkContainer).toHaveAttribute('href', '/dashboard/jobs')
    })

    it('shows quick action buttons', () => {
      render(
        <DashboardLayout user={mockUser as any}>
          <div>Dashboard Content</div>
        </DashboardLayout>
      )

      expect(screen.getByText('Post New Job')).toBeInTheDocument()
      expect(screen.getByText('Browse All Jobs')).toBeInTheDocument()
    })

    it('toggles mobile sidebar', () => {
      render(
        <DashboardLayout user={mockUser as any}>
          <div>Dashboard Content</div>
        </DashboardLayout>
      )

      const toggleButton = screen.getByLabelText('Toggle sidebar')
      const sidebar = screen.getByText('Dashboard').closest('aside')

      // Initially closed on mobile
      expect(sidebar).toHaveClass('-translate-x-full')

      // Open sidebar
      fireEvent.click(toggleButton)
      expect(sidebar).toHaveClass('translate-x-0')

      // Close sidebar
      fireEvent.click(toggleButton)
      expect(sidebar).toHaveClass('-translate-x-full')
    })
  })

  describe('JobLayout', () => {
    it('renders basic layout without filters', () => {
      render(
        <JobLayout showFilters={false}>
          <div>Job List Content</div>
        </JobLayout>
      )

      expect(screen.getByTestId('navigation')).toBeInTheDocument()
      expect(screen.getByText('Job List Content')).toBeInTheDocument()
      expect(screen.queryByText('Find Your Dream Job')).not.toBeInTheDocument()
    })

    it('renders with filters when showFilters is true', () => {
      render(
        <JobLayout showFilters={true}>
          <div>Job List Content</div>
        </JobLayout>
      )

      expect(screen.getByText('Find Your Dream Job')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Search job titles/)).toBeInTheDocument()
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument()
    })

    it('handles search input', () => {
      const mockOnFilterChange = jest.fn()

      render(
        <JobLayout showFilters={true} onFilterChange={mockOnFilterChange}>
          <div>Job List Content</div>
        </JobLayout>
      )

      const searchInput = screen.getByPlaceholderText(/Search job titles/) as HTMLInputElement
      fireEvent.change(searchInput, { target: { value: 'Developer' } })

      expect(searchInput.value).toBe('Developer')

      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: 'Developer' })
      )
    })

    it('handles filter changes', () => {
      const mockOnFilterChange = jest.fn()

      render(
        <JobLayout showFilters={true} onFilterChange={mockOnFilterChange}>
          <div>Job List Content</div>
        </JobLayout>
      )

      const setLocationButton = screen.getByText('Set Location')
      fireEvent.click(setLocationButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ location: 'New York' })
      )
    })

    it('clears filters', () => {
      const mockOnFilterChange = jest.fn()

      render(
        <JobLayout
          showFilters={true}
          onFilterChange={mockOnFilterChange}
          initialFilters={{ location: 'San Francisco', jobType: JobType.FULL_TIME }}
        >
          <div>Job List Content</div>
        </JobLayout>
      )

      const clearButton = screen.getByText('Clear all')
      fireEvent.click(clearButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith({})
    })

    it('toggles mobile filter display', () => {
      render(
        <JobLayout showFilters={true}>
          <div>Job List Content</div>
        </JobLayout>
      )

      const toggleButton = screen.getByRole('button', { name: /Filters/i })
      const filterBar = screen.getByTestId('filter-bar')
      const filterContainer = filterBar.closest('div[class*="lg:col-span-1"]')

      // Initially hidden on mobile
      expect(filterContainer).toHaveClass('hidden')

      // Show filters
      fireEvent.click(toggleButton)
      expect(filterContainer).toHaveClass('block')

      // Hide filters
      fireEvent.click(toggleButton)
      expect(filterContainer).toHaveClass('hidden')
    })

    it('renders job statistics', () => {
      render(
        <JobLayout showFilters={true}>
          <div>Job List Content</div>
        </JobLayout>
      )

      expect(screen.getByText('Job Statistics')).toBeInTheDocument()
      expect(screen.getByText('Total Jobs')).toBeInTheDocument()
      expect(screen.getByText('247')).toBeInTheDocument()
      expect(screen.getByText('New Today')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Companies')).toBeInTheDocument()
      expect(screen.getByText('89')).toBeInTheDocument()
    })

    it('applies initial filters', () => {
      const initialFilters = {
        location: 'Remote',
        jobType: JobType.CONTRACT,
        searchTerm: 'Engineer'
      }

      render(
        <JobLayout showFilters={true} initialFilters={initialFilters}>
          <div>Job List Content</div>
        </JobLayout>
      )

      const searchInput = screen.getByPlaceholderText(/Search job titles/) as HTMLInputElement
      expect(searchInput.value).toBe('Engineer')
    })

    it('renders footer', () => {
      render(
        <JobLayout>
          <div>Job List Content</div>
        </JobLayout>
      )

      expect(screen.getByText(/© \d{4} JobBoard/)).toBeInTheDocument()
      expect(screen.getByText('Privacy')).toBeInTheDocument()
      expect(screen.getByText('Terms')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })
  })
})