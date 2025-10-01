import React from 'react'
import clsx from 'clsx'

export interface ErrorMessageProps {
  message?: string
  id?: string
  className?: string
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, id, className }) => {
  if (!message) return null

  return (
    <p
      id={id}
      className={clsx(
        'mt-1 text-sm text-red-600',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  )
}

export default ErrorMessage