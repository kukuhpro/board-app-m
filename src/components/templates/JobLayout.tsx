import React, { useState } from 'react'
import { Navigation } from '@/components/organisms'
import { FilterBar } from '@/components/molecules'
import type { User } from '@supabase/supabase-js'
import type { JobType } from '@/domain/valueObjects/JobType'
import clsx from 'clsx'

export interface JobLayoutProps {
  children: React.ReactNode
  user?: User | null
  onLogout?: () => void
  showFilters?: boolean
  onFilterChange?: (filters: JobFilters) => void
  initialFilters?: JobFilters
  className?: string
}

export interface JobFilters {
  location?: string
  jobType?: JobType
  searchTerm?: string
}

const JobLayout: React.FC<JobLayoutProps> = ({
  children,
  user,
  onLogout,
  showFilters = false,
  onFilterChange,
  initialFilters = {},
  className
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [filters, setFilters] = useState<JobFilters>(initialFilters)

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const handleLocationChange = (location: string) => {
    handleFilterChange({ ...filters, location })
  }

  const handleJobTypeChange = (jobType: JobType | undefined) => {
    handleFilterChange({ ...filters, jobType })
  }

  const handleClearFilters = () => {
    const clearedFilters: JobFilters = {}
    handleFilterChange(clearedFilters)
  }

  return (
    <div className={clsx('min-h-screen bg-gray-50 flex flex-col', className)}>
      {/* Navigation Header */}
      <Navigation user={user} onLogout={onLogout} />

      {/* Hero Section with Search */}
      {showFilters && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">
                Find Your Dream Job
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Discover opportunities that match your skills and aspirations
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-2">
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Search job titles, companies, or keywords..."
                      className="flex-grow px-4 py-2 text-gray-900 focus:outline-none"
                      value={filters.searchTerm || ''}
                      onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
                    />
                    <button
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                      onClick={() => onFilterChange?.(filters)}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showFilters && (
            <>
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden mb-4 w-full bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filters
                </span>
                <svg
                  className={clsx(
                    'w-5 h-5 transform transition-transform',
                    isMobileFilterOpen ? 'rotate-180' : ''
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Filters Container */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Filters */}
                <div
                  className={clsx(
                    'lg:col-span-1',
                    'lg:block',
                    isMobileFilterOpen ? 'block' : 'hidden'
                  )}
                >
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Filters
                      </h2>
                      {(filters.location || filters.jobType) && (
                        <button
                          onClick={handleClearFilters}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <FilterBar
                      location={filters.location}
                      jobType={filters.jobType}
                      onLocationChange={handleLocationChange}
                      onJobTypeChange={handleJobTypeChange}
                      onClearFilters={handleClearFilters}
                      orientation="vertical"
                    />

                    {/* Additional Filter Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        Job Statistics
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Jobs</span>
                          <span className="font-medium text-gray-900">247</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">New Today</span>
                          <span className="font-medium text-green-600">12</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Companies</span>
                          <span className="font-medium text-gray-900">89</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                  {children}
                </div>
              </div>
            </>
          )}

          {!showFilters && children}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} JobBoard. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                Privacy
              </a>
              <a href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                Terms
              </a>
              <a href="/contact" className="text-sm text-gray-500 hover:text-gray-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default JobLayout