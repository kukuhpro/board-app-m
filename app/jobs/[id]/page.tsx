'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import { Button, LoadingSpinner } from '@/components/atoms'
import { JobType } from '@/domain/valueObjects/JobType'
import { JobProps } from '@/domain/entities/Job'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface JobDetailResponse {
  success: boolean
  data: {
    job: JobProps
    isOwner: boolean
    canEdit: boolean
  }
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const isAuthenticated = useIsAuthenticated()

  const [job, setJob] = useState<JobProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const jobId = Array.isArray(params.id) ? params.id[0] : params.id

  const fetchJob = async () => {
    if (!jobId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}`)

      if (response.status === 404) {
        notFound()
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }

      const data: JobDetailResponse = await response.json()

      if (data.success) {
        setJob(data.data.job)
        setIsOwner(data.data.isOwner)
        setCanEdit(data.data.canEdit)
      } else {
        setError('Failed to load job details')
      }
    } catch (err) {
      console.error('Error fetching job:', err)
      setError('Failed to load job details')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/jobs/${jobId}/edit`)
  }

  const handleDelete = async () => {
    if (!jobId || !window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(true)

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        alert('Failed to delete job. Please try again.')
      }
    } catch (err) {
      console.error('Error deleting job:', err)
      alert('Failed to delete job. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getJobTypeBadgeColor = (type: JobType) => {
    switch (type) {
      case JobType.FULL_TIME:
        return 'bg-green-100 text-green-800 border-green-200'
      case JobType.PART_TIME:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case JobType.CONTRACT:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  useEffect(() => {
    fetchJob()
  }, [jobId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Job not found'}
          </h1>
          <Link href="/">
            <Button variant="primary">
              ← Back to Job Listings
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="secondary" size="small">
                ← Back to Jobs
              </Button>
            </Link>

            {isOwner && (
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleEdit}
                  disabled={!canEdit}
                >
                  Edit Job
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={handleDelete}
                  loading={deleteLoading}
                  disabled={deleteLoading}
                >
                  Delete Job
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Job Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {job.title}
                </h1>
                <h2 className="text-xl text-gray-600">
                  {job.company}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                {/* Location */}
                <div className="flex items-center text-gray-500">
                  <svg
                    className="mr-2 h-5 w-5"
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
                  <span className="text-base">{job.location}</span>
                </div>

                {/* Job Type */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getJobTypeBadgeColor(job.jobType)}`}
                >
                  {job.jobType}
                </span>

                {/* Posted Date */}
                <div className="flex items-center text-gray-500">
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-base">
                    Posted on {formatDate(job.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="px-6 py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Job Description
            </h3>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {job.description}
              </div>
            </div>
          </div>

          {/* Job Metadata */}
          {job.updatedAt !== job.createdAt && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated on {formatDate(job.updatedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Interested in this position?
            </h3>
            <p className="text-blue-700 mb-4">
              Contact {job.company} directly to apply for this job opportunity.
            </p>
            <div className="space-x-4">
              <Link href="/auth/login">
                <Button variant="primary">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="secondary">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        )}

        {isAuthenticated && !isOwner && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Interested in this position?
            </h3>
            <p className="text-green-700 mb-4">
              Contact {job.company} directly to apply for this job opportunity.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}