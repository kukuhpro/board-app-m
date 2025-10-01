import React from 'react'
import { LoadingSpinner } from '@/components/atoms'

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      {/* Loading Content */}
      <div className="text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Job Board
          </h1>
          <p className="text-lg text-gray-600">
            Building careers, connecting opportunities
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="mb-6">
          <LoadingSpinner size="large" />
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Loading...
          </p>
          <p className="text-sm text-gray-600">
            Please wait while we prepare your content
          </p>
        </div>

        {/* Loading Animation Dots */}
        <div className="mt-6 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* Optional: Loading Progress Bar */}
      <div className="mt-12 w-full max-w-md">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse w-1/3"></div>
        </div>
      </div>

      {/* Skeleton Content Preview */}
      <div className="mt-12 w-full max-w-4xl px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-500">
          Powered by Next.js and Supabase
        </p>
      </div>
    </div>
  )
}