'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import { JobForm } from '@/components/organisms'
import { LoadingSpinner } from '@/components/atoms'
import { UpdateJobSchema } from '@/lib/validations/job'
import type { UpdateJobInput } from '@/lib/validations/job'
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

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const isAuthenticated = useIsAuthenticated()

  const [job, setJob] = useState<JobProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const jobId = Array.isArray(params.id) ? params.id[0] : params.id

  const fetchJob = async () => {
    if (!jobId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}`)

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

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
        setCanEdit(data.data.canEdit)

        // If user doesn't have edit permissions, redirect to job detail
        if (!data.data.canEdit) {
          router.push(`/jobs/${jobId}`)
          return
        }
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

  const handleSubmit = async (data: UpdateJobInput) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (response.status === 403) {
        router.push(`/jobs/${jobId}`)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update job')
      }

      const result = await response.json()

      if (result.success) {
        // Redirect to the updated job's detail page
        router.push(`/jobs/${jobId}`)
      } else {
        throw new Error(result.error || 'Failed to update job')
      }
    } catch (error) {
      console.error('Error updating job:', error)
      throw error // Re-throw so JobForm can handle it
    }
  }

  const handleCancel = () => {
    router.push(`/jobs/${jobId}`)
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    fetchJob()
  }, [isAuthenticated, jobId])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        </div>
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
          <Link href="/dashboard">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You don't have permission to edit this job
          </h1>
          <Link href={`/jobs/${jobId}`}>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              ← Back to Job
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Job Posting
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Update the details for "{job.title}"
              </p>
            </div>
            <Link href={`/jobs/${jobId}`}>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                ← Back to Job
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8">
            <JobForm
              mode="edit"
              initialValues={{
                title: job.title,
                company: job.company,
                description: job.description,
                location: job.location,
                jobType: job.jobType
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              schema={UpdateJobSchema}
            />
          </div>
        </div>

        {/* Warning Section */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-yellow-800">
                Important Notice
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  Any changes you make will be immediately visible to job seekers.
                  Make sure all information is accurate before saving your updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}