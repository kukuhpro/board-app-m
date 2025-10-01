import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { UseFormRegisterReturn } from 'react-hook-form'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[]
  error?: boolean
  errorMessage?: string
  placeholder?: string
  fullWidth?: boolean
  register?: UseFormRegisterReturn
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error = false, errorMessage, placeholder, fullWidth = false, register, className, ...rest }, ref) => {
    const baseStyles = 'block rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed'

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'

    return (
      <select
        ref={ref}
        className={clsx(
          baseStyles,
          stateStyles,
          fullWidth && 'w-full',
          className
        )}
        aria-invalid={error}
        aria-describedby={errorMessage ? `${rest.id}-error` : undefined}
        {...register}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)

Select.displayName = 'Select'

export default Select