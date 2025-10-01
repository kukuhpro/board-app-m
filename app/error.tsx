'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/atoms'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-sm text-gray-600 mb-6">
              {isDevelopment ? (
                <>
                  <span className="font-medium">Error:</span> {error.message}
                  {error.digest && (
                    <>
                      <br />
                      <span className="font-medium">Digest:</span> {error.digest}
                    </>
                  )}
                </>
              ) : (
                "We're sorry, but something unexpected happened. Our team has been notified and we're working to fix the issue."
              )}
            </p>

            {/* Development Error Details */}
            {isDevelopment && error.stack && (
              <div className="mb-6 p-4 bg-gray-100 rounded-md text-left">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Stack Trace:
                </h3>
                <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={reset}
                className="w-full sm:w-auto"
              >
                Try Again
              </Button>

              <Link href="/" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="w-full"
                >
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If this problem persists, please{' '}
                <a
                  href="mailto:support@jobboard.com"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  contact support
                </a>
                {error.digest && ` with error ID: ${error.digest}`}
              </p>
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