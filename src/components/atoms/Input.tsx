import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { UseFormRegisterReturn } from 'react-hook-form'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean
  errorMessage?: string
  fullWidth?: boolean
  register?: UseFormRegisterReturn
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, errorMessage, fullWidth = false, register, className, ...rest }, ref) => {
    const baseStyles = 'block rounded-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed'

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'

    return (
      <input
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
      />
    )
  }
)

Input.displayName = 'Input'

export default Input