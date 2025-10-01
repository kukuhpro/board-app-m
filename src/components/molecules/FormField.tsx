import React from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import { Label, Input, Select, ErrorMessage } from '@/components/atoms'
import type { SelectOption } from '@/components/atoms'
import clsx from 'clsx'

export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select'
  placeholder?: string
  required?: boolean
  error?: string
  register?: UseFormRegisterReturn
  className?: string
  fullWidth?: boolean
  disabled?: boolean
  // For select type
  options?: SelectOption[]
  // For input type
  autoComplete?: string
  min?: string | number
  max?: string | number
  step?: string | number
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  error,
  register,
  className,
  fullWidth = true,
  disabled = false,
  options = [],
  autoComplete,
  min,
  max,
  step,
}) => {
  const fieldId = `field-${name}`
  const errorId = `${fieldId}-error`

  return (
    <div className={clsx('space-y-1', className)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>

      {type === 'select' ? (
        <Select
          id={fieldId}
          name={name}
          options={options}
          error={!!error}
          errorMessage={error}
          fullWidth={fullWidth}
          placeholder={placeholder}
          register={register}
          disabled={disabled}
          aria-describedby={error ? errorId : undefined}
        />
      ) : (
        <Input
          id={fieldId}
          name={name}
          type={type}
          placeholder={placeholder}
          error={!!error}
          errorMessage={error}
          fullWidth={fullWidth}
          register={register}
          disabled={disabled}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          aria-describedby={error ? errorId : undefined}
        />
      )}

      <ErrorMessage id={errorId} message={error} />
    </div>
  )
}

export default FormField