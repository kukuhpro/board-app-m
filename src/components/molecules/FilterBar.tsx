import React, { useState, useEffect } from 'react'
import { Input, Select, Button } from '@/components/atoms'
import { JobType } from '@/domain/valueObjects/JobType'
import clsx from 'clsx'

export interface FilterValues {
  location: string
  jobType: JobType | ''
}

export interface FilterBarProps {
  onLocationChange?: (location: string) => void
  onTypeChange?: (jobType: JobType | '') => void
  onFiltersChange?: (filters: FilterValues) => void
  currentFilters?: FilterValues
  className?: string
}

const FilterBar: React.FC<FilterBarProps> = ({
  onLocationChange,
  onTypeChange,
  onFiltersChange,
  currentFilters = { location: '', jobType: '' },
  className
}) => {
  const [filters, setFilters] = useState<FilterValues>(currentFilters)

  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters.location, currentFilters.jobType])

  const jobTypeOptions = [
    { value: '', label: 'All Types' },
    { value: JobType.FULL_TIME, label: 'Full-Time' },
    { value: JobType.PART_TIME, label: 'Part-Time' },
    { value: JobType.CONTRACT, label: 'Contract' }
  ]

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value
    setFilters(prev => ({ ...prev, location: newLocation }))

    if (onLocationChange) {
      onLocationChange(newLocation)
    }
    if (onFiltersChange) {
      onFiltersChange({ ...filters, location: newLocation })
    }
  }

  const handleJobTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJobType = e.target.value as JobType | ''
    setFilters(prev => ({ ...prev, jobType: newJobType }))

    if (onTypeChange) {
      onTypeChange(newJobType)
    }
    if (onFiltersChange) {
      onFiltersChange({ ...filters, jobType: newJobType })
    }
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = { location: '', jobType: '' }
    setFilters(clearedFilters)

    if (onLocationChange) {
      onLocationChange('')
    }
    if (onTypeChange) {
      onTypeChange('')
    }
    if (onFiltersChange) {
      onFiltersChange(clearedFilters)
    }
  }

  const hasActiveFilters = filters.location !== '' || filters.jobType !== ''

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        {/* Location Filter */}
        <div className="flex-1">
          <label htmlFor="location-filter" className="sr-only">
            Filter by location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
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
            </div>
            <Input
              id="location-filter"
              type="text"
              placeholder="Search by location..."
              value={filters.location}
              onChange={handleLocationChange}
              className="pl-10"
              fullWidth
              aria-label="Filter by location"
            />
          </div>
        </div>

        {/* Job Type Filter */}
        <div className="flex-1 md:max-w-xs">
          <label htmlFor="jobtype-filter" className="sr-only">
            Filter by job type
          </label>
          <Select
            id="jobtype-filter"
            options={jobTypeOptions}
            value={filters.jobType}
            onChange={handleJobTypeChange}
            fullWidth
            aria-label="Filter by job type"
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-center">
            <Button
              variant="secondary"
              size="medium"
              onClick={handleClearFilters}
              aria-label="Clear all filters"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Location: {filters.location}
            </span>
          )}
          {filters.jobType && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Type: {filters.jobType}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterBar