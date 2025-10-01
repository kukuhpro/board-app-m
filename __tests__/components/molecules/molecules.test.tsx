import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  FormField,
  JobCard,
  FilterBar,
  EmptyState
} from '@/components/molecules'
import { JobType } from '@/domain/valueObjects/JobType'
import type { JobCardData } from '@/components/molecules'

describe('Molecule Components', () => {
  describe('FormField Component', () => {
    it('renders label, input, and handles text input', () => {
      render(
        <FormField
          label="Test Label"
          name="testField"
          type="text"
          placeholder="Enter text"
        />
      )

      expect(screen.getByText('Test Label')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('shows required indicator when required', () => {
      render(
        <FormField
          label="Required Field"
          name="required"
          required
        />
      )

      expect(screen.getByLabelText('required')).toBeInTheDocument()
    })

    it('displays error message when error is provided', () => {
      render(
        <FormField
          label="Error Field"
          name="errorField"
          error="This field has an error"
        />
      )

      expect(screen.getByText('This field has an error')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders select when type is select', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ]

      render(
        <FormField
          label="Select Field"
          name="selectField"
          type="select"
          options={options}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('passes disabled prop to input', () => {
      render(
        <FormField
          label="Disabled Field"
          name="disabled"
          disabled
        />
      )

      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('sets aria-describedby when error exists', () => {
      render(
        <FormField
          label="Field with Error"
          name="fieldWithError"
          error="Error message"
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'field-fieldWithError-error')
    })
  })

  describe('JobCard Component', () => {
    const mockJob: JobCardData = {
      id: '1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      jobType: JobType.FULL_TIME,
      createdAt: new Date()
    }

    it('displays job information correctly', () => {
      render(<JobCard job={mockJob} />)

      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('Full-Time')).toBeInTheDocument()
      expect(screen.getByText('Today')).toBeInTheDocument()
    })

    it('formats date correctly for different time periods', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const { rerender } = render(<JobCard job={{ ...mockJob, createdAt: yesterday }} />)
      expect(screen.getByText('Yesterday')).toBeInTheDocument()

      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
      rerender(<JobCard job={{ ...mockJob, createdAt: fiveDaysAgo }} />)
      expect(screen.getByText('5 days ago')).toBeInTheDocument()

      const threeWeeksAgo = new Date()
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)
      rerender(<JobCard job={{ ...mockJob, createdAt: threeWeeksAgo }} />)
      expect(screen.getByText('3 weeks ago')).toBeInTheDocument()
    })

    it('applies correct badge colors for job types', () => {
      const { rerender } = render(<JobCard job={mockJob} />)
      let badge = screen.getByText('Full-Time')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')

      rerender(<JobCard job={{ ...mockJob, jobType: JobType.PART_TIME }} />)
      badge = screen.getByText('Part-Time')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')

      rerender(<JobCard job={{ ...mockJob, jobType: JobType.CONTRACT }} />)
      badge = screen.getByText('Contract')
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')
    })

    it('handles click events when onClick is provided', () => {
      const handleClick = jest.fn()
      render(<JobCard job={mockJob} onClick={handleClick} />)

      const card = screen.getByRole('button')
      fireEvent.click(card)

      expect(handleClick).toHaveBeenCalledWith(mockJob)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard navigation when clickable', () => {
      const handleClick = jest.fn()
      render(<JobCard job={mockJob} onClick={handleClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledWith(mockJob)

      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('is not interactive when onClick is not provided', () => {
      render(<JobCard job={mockJob} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('FilterBar Component', () => {
    it('renders location and job type filters', () => {
      render(<FilterBar />)

      expect(screen.getByPlaceholderText('Search by location...')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by job type')).toBeInTheDocument()
      expect(screen.getByText('All Types')).toBeInTheDocument()
    })

    it('handles location change', () => {
      const handleLocationChange = jest.fn()
      render(<FilterBar onLocationChange={handleLocationChange} />)

      const locationInput = screen.getByPlaceholderText('Search by location...')
      fireEvent.change(locationInput, { target: { value: 'New York' } })

      expect(handleLocationChange).toHaveBeenCalledWith('New York')
    })

    it('handles job type change', () => {
      const handleTypeChange = jest.fn()
      render(<FilterBar onTypeChange={handleTypeChange} />)

      const typeSelect = screen.getByLabelText('Filter by job type')
      fireEvent.change(typeSelect, { target: { value: JobType.FULL_TIME } })

      expect(handleTypeChange).toHaveBeenCalledWith(JobType.FULL_TIME)
    })

    it('shows clear button when filters are active', () => {
      render(
        <FilterBar
          currentFilters={{ location: 'San Francisco', jobType: JobType.FULL_TIME }}
        />
      )

      expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    })

    it('clears all filters when clear button is clicked', () => {
      const handleLocationChange = jest.fn()
      const handleTypeChange = jest.fn()

      render(
        <FilterBar
          currentFilters={{ location: 'San Francisco', jobType: JobType.FULL_TIME }}
          onLocationChange={handleLocationChange}
          onTypeChange={handleTypeChange}
        />
      )

      const clearButton = screen.getByText('Clear Filters')
      fireEvent.click(clearButton)

      expect(handleLocationChange).toHaveBeenCalledWith('')
      expect(handleTypeChange).toHaveBeenCalledWith('')
    })

    it('displays active filters', () => {
      render(
        <FilterBar
          currentFilters={{ location: 'Remote', jobType: JobType.CONTRACT }}
        />
      )

      expect(screen.getByText('Active filters:')).toBeInTheDocument()
      expect(screen.getByText('Location: Remote')).toBeInTheDocument()
      expect(screen.getByText('Type: Contract')).toBeInTheDocument()
    })

    it('calls onFiltersChange with all filter values', () => {
      const handleFiltersChange = jest.fn()
      render(<FilterBar onFiltersChange={handleFiltersChange} />)

      const locationInput = screen.getByPlaceholderText('Search by location...')
      fireEvent.change(locationInput, { target: { value: 'Boston' } })

      expect(handleFiltersChange).toHaveBeenCalledWith({
        location: 'Boston',
        jobType: ''
      })
    })
  })

  describe('EmptyState Component', () => {
    it('renders title and description', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try adjusting your filters"
        />
      )

      expect(screen.getByText('No results found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
    })

    it('renders default icon when no icon provided', () => {
      render(<EmptyState title="Empty" />)

      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('renders custom icon when provided', () => {
      const customIcon = <div data-testid="custom-icon">Custom Icon</div>
      render(
        <EmptyState
          title="Empty"
          icon={customIcon}
        />
      )

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('renders action button when action is provided', () => {
      const handleAction = jest.fn()
      render(
        <EmptyState
          title="No jobs"
          action={{
            label: 'Create First Job',
            onClick: handleAction
          }}
        />
      )

      const button = screen.getByText('Create First Job')
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    it('uses correct button variant for action', () => {
      render(
        <EmptyState
          title="Empty"
          action={{
            label: 'Action',
            onClick: jest.fn(),
            variant: 'secondary'
          }}
        />
      )

      const button = screen.getByText('Action')
      expect(button).toHaveClass('bg-gray-200')
    })

    it('does not render description when not provided', () => {
      render(<EmptyState title="Just Title" />)

      expect(screen.getByText('Just Title')).toBeInTheDocument()
      expect(screen.queryByText('Try adjusting your filters')).not.toBeInTheDocument()
    })
  })
})