import React from 'react'
import clsx from 'clsx'

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
  label?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className,
  label = 'Loading...'
}) => {
  const sizeStyles = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4'
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-gray-300 border-t-blue-600',
          sizeStyles[size]
        )}
        role="status"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
      </div>
    </div>
  )
}

export default LoadingSpinner