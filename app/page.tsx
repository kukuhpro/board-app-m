'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterBar, JobCard } from '@/components/molecules'
import { JobList } from '@/components/organisms'
import type { JobCardData, FilterValues } from '@/components/molecules'
import { JobType } from '@/domain/valueObjects/JobType'
import { useIsAuthenticated } from '@/stores/authStore'
import Link from 'next/link'

interface JobResponse {
  success: boolean
  data: {
    jobs: JobCardData[]
    total: number
    page: number
    totalPages: number
  }
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAuthenticated = useIsAuthenticated()

  const [jobs, setJobs] = useState<JobCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<FilterValues>({
    location: searchParams.get('location') || '',
    jobType: (searchParams.get('jobType') as JobType) || ''
  })

  const fetchJobs = async (page: number = 1, currentFilters: FilterValues = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })

      if (currentFilters.location) {
        params.append('location', currentFilters.location)
      }
      if (currentFilters.jobType) {
        params.append('jobType', currentFilters.jobType)
      }

      const response = await fetch(`/api/jobs?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data: JobResponse = await response.json()

      if (data.success && data.data && Array.isArray(data.data.jobs)) {
        setJobs(data.data.jobs)
        setCurrentPage(data.data.page)
        setTotalPages(data.data.totalPages)
      } else {
        console.error('Failed to fetch jobs')
        setJobs([])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const updateURLParams = (newFilters: FilterValues, page: number = 1) => {
    const params = new URLSearchParams()

    if (newFilters.location) {
      params.set('location', newFilters.location)
    }
    if (newFilters.jobType) {
      params.set('jobType', newFilters.jobType)
    }
    if (page > 1) {
      params.set('page', page.toString())
    }

    const newURL = params.toString() ? `/?${params.toString()}` : '/'
    router.push(newURL, { scroll: false })
  }

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
    setCurrentPage(1)
    updateURLParams(newFilters, 1)
    fetchJobs(1, newFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURLParams(filters, page)
    fetchJobs(page, filters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleJobClick = (job: JobCardData) => {
    router.push(`/jobs/${job.id}`)
  }

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1')
    setCurrentPage(page)
    fetchJobs(page, filters)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <div className="flex space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/register">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                Job Board
              </h1>
            </Link>
            <p className="text-lg text-gray-600">
              Discover your next career opportunity
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="mb-8">
          <FilterBar
            currentFilters={filters}
            onFiltersChange={handleFiltersChange}
            className="sticky top-4 z-10"
          />
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Available Positions
            </h2>
            {!loading && jobs.length > 0 && (
              <p className="text-gray-600">
                Showing {jobs.length} of {totalPages * 12} jobs
              </p>
            )}
          </div>

          <JobList
            jobs={jobs}
            loading={loading}
            onJobClick={handleJobClick}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            emptyStateTitle="No jobs found"
            emptyStateDescription="There are no job postings matching your criteria. Try adjusting your filters or check back later."
            emptyStateActionLabel="Post a job"
            onEmptyStateAction={() => router.push('/jobs/new')}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © 2024 Job Board. Built with Next.js and Supabase.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}