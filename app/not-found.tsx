import React from 'react'
import { Button } from '@/components/atoms'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* 404 Illustration */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-5a9 9 0 110 18 9 9 0 010-18z"
                />
              </svg>
            </div>

            {/* Error Code */}
            <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Page Not Found
            </h2>

            {/* Error Description */}
            <p className="text-sm text-gray-600 mb-6">
              The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full"
                >
                  Go Home
                </Button>
              </Link>

              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="w-full"
                >
                  Dashboard
                </Button>
              </Link>
            </div>

            {/* Popular Links */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Popular Pages
              </h3>
              <div className="space-y-2">
                <Link
                  href="/"
                  className="block text-sm text-blue-600 hover:text-blue-500"
                >
                  Browse Jobs
                </Link>
                <Link
                  href="/jobs/new"
                  className="block text-sm text-blue-600 hover:text-blue-500"
                >
                  Post a Job
                </Link>
                <Link
                  href="/auth/login"
                  className="block text-sm text-blue-600 hover:text-blue-500"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block text-sm text-blue-600 hover:text-blue-500"
                >
                  Create Account
                </Link>
              </div>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Still can't find what you're looking for?{' '}
                <a
                  href="mailto:support@jobboard.com"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Suggestion */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800">
                Looking for a specific job?
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  Try browsing our{' '}
                  <Link href="/" className="font-medium underline">
                    job listings
                  </Link>{' '}
                  or use the search filters to find what you need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Job Board - Building careers, connecting opportunities
        </p>
      </div>
    </div>
  )
}