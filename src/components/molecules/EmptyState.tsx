import React from 'react'
import { Button } from '@/components/atoms'
import clsx from 'clsx'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface EmptyStateProps {
  title: string
  description?: string
  action?: EmptyStateAction
  icon?: React.ReactNode
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className
}) => {
  const defaultIcon = (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      />
    </svg>
  )

  return (
    <div className={clsx('text-center py-12 px-4', className)}>
      <div className="flex flex-col items-center">
        {/* Icon */}
        <div className="mb-4">
          {icon || defaultIcon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 max-w-md mb-6">
            {description}
          </p>
        )}

        {/* Action Button */}
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            size="medium"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}

export default EmptyState