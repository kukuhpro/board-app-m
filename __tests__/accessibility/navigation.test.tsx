import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import Navigation from '@/components/organisms/Navigation'
import { SkipNavigation } from '@/components/atoms/SkipNavigation'

expect.extend(toHaveNoViolations)

describe('Navigation Accessibility', () => {
  describe('Skip Navigation', () => {
    it('should render skip navigation link', () => {
      render(<SkipNavigation />)
      const skipLink = screen.getByText('Skip to main content')
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    it('should be hidden by default but visible on focus', () => {
      render(<SkipNavigation />)
      const skipLink = screen.getByText('Skip to main content')
      expect(skipLink).toHaveClass('sr-only')
      expect(skipLink).toHaveClass('focus:not-sr-only')
    })

    it('should have proper ARIA label', () => {
      render(<SkipNavigation />)
      const skipLink = screen.getByLabelText('Skip to main content')
      expect(skipLink).toBeInTheDocument()
    })
  })

  describe('Main Navigation', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Navigation />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper navigation landmark', () => {
      render(<Navigation />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    it('should have accessible mobile menu button', () => {
      render(<Navigation />)
      const menuButton = screen.getByLabelText('Main menu')
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update aria-expanded when mobile menu is toggled', () => {
      render(<Navigation />)
      const menuButton = screen.getByLabelText('Main menu')

      fireEvent.click(menuButton)
      expect(menuButton).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(menuButton)
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<Navigation />)
      const svgIcons = container.querySelectorAll('svg[aria-hidden="true"]')
      expect(svgIcons.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', () => {
      render(<Navigation />)
      const links = screen.getAllByRole('link')

      links.forEach(link => {
        // Check that links are focusable
        expect(link).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('Focus Management', () => {
    it('should maintain focus order', () => {
      const { container } = render(<Navigation />)
      const focusableElements = container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      const tabIndexes = Array.from(focusableElements).map(el =>
        parseInt(el.getAttribute('tabindex') || '0')
      )

      // Ensure no positive tabindex values (which break natural focus order)
      tabIndexes.forEach(index => {
        expect(index).toBeLessThanOrEqual(0)
      })
    })
  })
})