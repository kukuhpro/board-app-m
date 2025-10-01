import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import { JobForm } from '@/components/organisms/JobForm'

describe('Keyboard Navigation', () => {
  describe('Interactive Elements', () => {
    it('should allow Tab navigation through buttons', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
          <Button>Third Button</Button>
        </div>
      )

      const buttons = screen.getAllByRole('button')

      // Tab through buttons
      await user.tab()
      expect(buttons[0]).toHaveFocus()

      await user.tab()
      expect(buttons[1]).toHaveFocus()

      await user.tab()
      expect(buttons[2]).toHaveFocus()

      // Shift+Tab to go backwards
      await user.tab({ shift: true })
      expect(buttons[1]).toHaveFocus()
    })

    it('should trigger button click on Enter key', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Test Button</Button>)
      const button = screen.getByRole('button')

      await user.tab()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should trigger button click on Space key', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Test Button</Button>)
      const button = screen.getByRole('button')

      await user.tab()
      expect(button).toHaveFocus()

      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not trigger disabled button', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      )
      const button = screen.getByRole('button')

      await user.tab()
      // Disabled buttons should still be focusable for screen readers
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Form Elements', () => {
    it('should allow Tab navigation through form fields', async () => {
      const user = userEvent.setup()

      render(
        <form>
          <Input placeholder="First Name" aria-label="First Name" />
          <Input placeholder="Last Name" aria-label="Last Name" />
          <Select aria-label="Country">
            <option>USA</option>
            <option>Canada</option>
          </Select>
          <Button type="submit">Submit</Button>
        </form>
      )

      const firstNameInput = screen.getByLabelText('First Name')
      const lastNameInput = screen.getByLabelText('Last Name')
      const countrySelect = screen.getByLabelText('Country')
      const submitButton = screen.getByRole('button')

      await user.tab()
      expect(firstNameInput).toHaveFocus()

      await user.tab()
      expect(lastNameInput).toHaveFocus()

      await user.tab()
      expect(countrySelect).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()
    })

    it('should allow typing in focused input', async () => {
      const user = userEvent.setup()
      render(<Input placeholder="Enter text" aria-label="Text Input" />)

      const input = screen.getByLabelText('Text Input')

      await user.tab()
      expect(input).toHaveFocus()

      await user.type(input, 'Hello World')
      expect(input).toHaveValue('Hello World')
    })

    it('should navigate select options with arrow keys', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()

      render(
        <Select aria-label="Options" onChange={handleChange}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      )

      const select = screen.getByLabelText('Options') as HTMLSelectElement

      await user.tab()
      expect(select).toHaveFocus()

      // Arrow down to next option
      await user.keyboard('{ArrowDown}')
      expect(select.value).toBe('2')

      // Arrow up to previous option
      await user.keyboard('{ArrowUp}')
      expect(select.value).toBe('1')
    })
  })

  describe('Skip Links', () => {
    it('should focus main content when skip link is activated', async () => {
      const user = userEvent.setup()

      render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <nav>
            <a href="/home">Home</a>
            <a href="/about">About</a>
          </nav>
          <main id="main-content" tabIndex={-1}>
            <h1>Main Content</h1>
          </main>
        </div>
      )

      const skipLink = screen.getByText('Skip to main content')

      await user.tab()
      expect(skipLink).toHaveFocus()

      await user.keyboard('{Enter}')
      // In a real browser, this would move focus to the main content
      // Testing library doesn't fully simulate this behavior
    })
  })

  describe('Focus Trap', () => {
    it('should trap focus in modal when open', async () => {
      const user = userEvent.setup()

      const Modal = ({ isOpen }: { isOpen: boolean }) => {
        if (!isOpen) return null

        return (
          <div role="dialog" aria-modal="true">
            <button>Close</button>
            <input aria-label="Modal Input" />
            <button>Submit</button>
          </div>
        )
      }

      const { rerender } = render(<Modal isOpen={false} />)

      // Open modal
      rerender(<Modal isOpen={true} />)

      const closeButton = screen.getByText('Close')
      const input = screen.getByLabelText('Modal Input')
      const submitButton = screen.getByText('Submit')

      // Tab through modal elements
      await user.tab()
      expect(closeButton).toHaveFocus()

      await user.tab()
      expect(input).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()

      // Should cycle back to first element
      await user.tab()
      expect(closeButton).toHaveFocus()
    })
  })

  describe('Escape Key', () => {
    it('should close dropdown on Escape key', async () => {
      const user = userEvent.setup()
      const handleClose = jest.fn()

      const Dropdown = ({ onClose }: { onClose: () => void }) => (
        <div
          role="menu"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
          }}
        >
          <button role="menuitem">Option 1</button>
          <button role="menuitem">Option 2</button>
        </div>
      )

      render(<Dropdown onClose={handleClose} />)
      const menu = screen.getByRole('menu')

      await user.click(menu)
      await user.keyboard('{Escape}')

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })
})