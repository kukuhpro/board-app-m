import React from 'react'
import clsx from 'clsx'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  children: React.ReactNode
}

const Label: React.FC<LabelProps> = ({ required = false, children, className, ...rest }) => {
  return (
    <label
      className={clsx(
        'block text-sm font-medium text-gray-700',
        className
      )}
      {...rest}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-label="required">
          *
        </span>
      )}
    </label>
  )
}

export default Label