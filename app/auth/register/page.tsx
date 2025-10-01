'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/authStore'
import dynamic from 'next/dynamic'

const AuthForm = dynamic(
  () => import('@/components/organisms/AuthForm'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="bg-white shadow-lg rounded-lg px-8 py-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSuccess = () => {
    router.push('/dashboard')
  }

  // Show loading state while checking authentication
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 hover:text-emerald-600 transition-colors">
              Job Board
            </h1>
          </Link>
          <p className="text-lg text-gray-600">Start your journey today</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm
          mode="register"
          onSuccess={handleSuccess}
          className="animate-fade-in"
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}