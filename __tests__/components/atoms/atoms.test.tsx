import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  Button,
  Input,
  Select,
  Label,
  ErrorMessage,
  LoadingSpinner
} from '@/components/atoms'

describe('Atom Components', () => {
  describe('Button Component', () => {
    it('renders with children', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('applies variant styles', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      expect(screen.getByText('Primary')).toHaveClass('bg-blue-600')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByText('Secondary')).toHaveClass('bg-gray-200')

      rerender(<Button variant="danger">Danger</Button>)
      expect(screen.getByText('Danger')).toHaveClass('bg-red-600')
    })

    it('applies size styles', () => {
      const { rerender } = render(<Button size="small">Small</Button>)
      expect(screen.getByText('Small')).toHaveClass('px-3', 'py-1.5')

      rerender(<Button size="medium">Medium</Button>)
      expect(screen.getByText('Medium')).toHaveClass('px-4', 'py-2')

      rerender(<Button size="large">Large</Button>)
      expect(screen.getByText('Large')).toHaveClass('px-6', 'py-3')
    })

    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByText('Loading')
      expect(button).toBeDisabled()
      expect(button.querySelector('svg')).toHaveClass('animate-spin')
    })

    it('handles click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      fireEvent.click(screen.getByText('Click me'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies fullWidth style', () => {
      render(<Button fullWidth>Full Width</Button>)
      expect(screen.getByText('Full Width')).toHaveClass('w-full')
    })
  })

  describe('Input Component', () => {
    it('renders input field', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('applies error styles when error prop is true', () => {
      render(<Input error placeholder="Error input" />)
      const input = screen.getByPlaceholderText('Error input')
      expect(input).toHaveClass('border-red-500')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('handles disabled state', () => {
      render(<Input disabled placeholder="Disabled input" />)
      const input = screen.getByPlaceholderText('Disabled input')
      expect(input).toBeDisabled()
    })

    it('applies fullWidth style', () => {
      render(<Input fullWidth placeholder="Full width" />)
      expect(screen.getByPlaceholderText('Full width')).toHaveClass('w-full')
    })

    it('handles value changes', () => {
      const handleChange = jest.fn()
      render(<Input placeholder="Type here" onChange={handleChange} />)
      const input = screen.getByPlaceholderText('Type here')
      fireEvent.change(input, { target: { value: 'test value' } })
      expect(handleChange).toHaveBeenCalled()
    })

    it('sets aria-describedby when errorMessage is provided', () => {
      render(<Input id="test-input" error errorMessage="Error message" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error')
    })
  })

  describe('Select Component', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ]

    it('renders select with options', () => {
      render(<Select options={options} />)
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    it('renders placeholder option when provided', () => {
      render(<Select options={options} placeholder="Choose an option" />)
      expect(screen.getByText('Choose an option')).toBeInTheDocument()
    })

    it('applies error styles', () => {
      render(<Select options={options} error />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-red-500')
      expect(select).toHaveAttribute('aria-invalid', 'true')
    })

    it('handles disabled state', () => {
      render(<Select options={options} disabled />)
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('applies fullWidth style', () => {
      render(<Select options={options} fullWidth />)
      expect(screen.getByRole('combobox')).toHaveClass('w-full')
    })

    it('handles value changes', () => {
      const handleChange = jest.fn()
      render(<Select options={options} onChange={handleChange} />)
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'option2' } })
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Label Component', () => {
    it('renders label with text', () => {
      render(<Label htmlFor="test-input">Test Label</Label>)
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('shows required indicator when required prop is true', () => {
      render(<Label required>Required Field</Label>)
      const asterisk = screen.getByLabelText('required')
      expect(asterisk).toBeInTheDocument()
      expect(asterisk).toHaveClass('text-red-500')
    })

    it('does not show required indicator when required is false', () => {
      render(<Label>Optional Field</Label>)
      expect(screen.queryByLabelText('required')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Label className="custom-class">Label</Label>)
      expect(screen.getByText('Label')).toHaveClass('custom-class')
    })
  })

  describe('ErrorMessage Component', () => {
    it('renders error message when message is provided', () => {
      render(<ErrorMessage message="This is an error" />)
      const error = screen.getByText('This is an error')
      expect(error).toBeInTheDocument()
      expect(error).toHaveClass('text-red-600')
    })

    it('returns null when message is not provided', () => {
      const { container } = render(<ErrorMessage />)
      expect(container.firstChild).toBeNull()
    })

    it('sets correct ARIA attributes', () => {
      render(<ErrorMessage message="Error occurred" />)
      const error = screen.getByText('Error occurred')
      expect(error).toHaveAttribute('role', 'alert')
      expect(error).toHaveAttribute('aria-live', 'polite')
    })

    it('sets id when provided', () => {
      render(<ErrorMessage message="Error" id="error-id" />)
      expect(screen.getByText('Error')).toHaveAttribute('id', 'error-id')
    })

    it('applies custom className', () => {
      render(<ErrorMessage message="Error" className="custom-error" />)
      expect(screen.getByText('Error')).toHaveClass('custom-error')
    })
  })

  describe('LoadingSpinner Component', () => {
    it('renders loading spinner', () => {
      render(<LoadingSpinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('applies size styles', () => {
      const { rerender } = render(<LoadingSpinner size="small" />)
      expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4')

      rerender(<LoadingSpinner size="medium" />)
      expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8')

      rerender(<LoadingSpinner size="large" />)
      expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12')
    })

    it('has spinning animation', () => {
      render(<LoadingSpinner />)
      expect(screen.getByRole('status')).toHaveClass('animate-spin')
    })

    it('includes accessible label', () => {
      render(<LoadingSpinner label="Loading data..." />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data...')
      expect(screen.getByText('Loading data...')).toHaveClass('sr-only')
    })

    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-spinner" />)
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('custom-spinner')
    })

    it('uses default label when not provided', () => {
      render(<LoadingSpinner />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...')
    })
  })
})