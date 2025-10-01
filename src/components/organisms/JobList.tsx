import React, { useState } from 'react'
import { JobCard, EmptyState } from '@/components/molecules'
import { Button, LoadingSpinner } from '@/components/atoms'
import type { JobCardData } from '@/components/molecules'
import clsx from 'clsx'

export interface JobListProps {
  jobs: JobCardData[]
  loading?: boolean
  onJobClick?: (job: JobCardData) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  className?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  onEmptyStateAction?: () => void
  emptyStateActionLabel?: string
}

type ViewMode = 'grid' | 'list'

const JobList: React.FC<JobListProps> = ({
  jobs,
  loading = false,
  onJobClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
  emptyStateTitle = 'No jobs found',
  emptyStateDescription = 'There are no job postings available at the moment.',
  onEmptyStateAction,
  emptyStateActionLabel = 'Post a job'
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const handlePageChange = (newPage: number) => {
    if (onPageChange && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage)
    }
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    return (
      <nav
        className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6"
        aria-label="Pagination"
      >
        <div className="hidden sm:block">
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div className="flex flex-1 justify-between sm:justify-end">
          <Button
            variant="secondary"
            size="small"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="mr-3"
          >
            Previous
          </Button>

          <div className="hidden md:flex space-x-2">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  1
                </button>
                {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
              </>
            )}

            {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={clsx(
                    'px-3 py-1 text-sm rounded',
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            )}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <Button
            variant="secondary"
            size="small"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </nav>
    )
  }

  if (loading) {
    return (
      <div className={clsx('flex justify-center items-center py-12', className)}>
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className={clsx('bg-white rounded-lg shadow', className)}>
        <EmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
          action={
            onEmptyStateAction
              ? {
                  label: emptyStateActionLabel,
                  onClick: onEmptyStateAction
                }
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-l-lg',
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            )}
            aria-pressed={viewMode === 'grid'}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="sr-only">Grid view</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-r-lg',
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            )}
            aria-pressed={viewMode === 'list'}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">List view</span>
          </button>
        </div>
      </div>

      {/* Job Cards */}
      <div
        className={clsx(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        )}
      >
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onClick={onJobClick}
            className={viewMode === 'list' ? 'w-full' : ''}
          />
        ))}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  )
}

export default JobList