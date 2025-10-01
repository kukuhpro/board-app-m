import React from 'react'
import clsx from 'clsx'
import { JobType } from '@/domain/valueObjects/JobType'

export interface JobCardData {
  id: string
  title: string
  company: string
  location: string
  jobType: JobType
  createdAt: Date | string
}

export interface JobCardProps {
  job: JobCardData
  onClick?: (job: JobCardData) => void
  className?: string
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick, className }) => {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} ${months === 1 ? 'month' : 'months'} ago`
    } else {
      const years = Math.floor(diffInDays / 365)
      return `${years} ${years === 1 ? 'year' : 'years'} ago`
    }
  }

  const getJobTypeBadgeColor = (type: JobType) => {
    switch (type) {
      case JobType.FULL_TIME:
        return 'bg-green-100 text-green-800'
      case JobType.PART_TIME:
        return 'bg-blue-100 text-blue-800'
      case JobType.CONTRACT:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick(job)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick(job)
    }
  }

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-6 transition-all',
        onClick && 'cursor-pointer hover:shadow-lg hover:border-blue-300',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Job listing: ${job.title} at ${job.company}`}
    >
      <div className="flex flex-col space-y-3">
        {/* Header with job title and company */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {job.title}
          </h3>
          <p className="text-base text-gray-600">
            {job.company}
          </p>
        </div>

        {/* Job details */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Location */}
          <div className="flex items-center text-gray-500">
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{job.location}</span>
          </div>

          {/* Job Type Badge */}
          <span
            className={clsx(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              getJobTypeBadgeColor(job.jobType)
            )}
          >
            {job.jobType}
          </span>

          {/* Posted date */}
          <div className="flex items-center text-gray-500">
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatDate(job.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobCard