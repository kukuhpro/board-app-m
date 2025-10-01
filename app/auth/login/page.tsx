'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated, useAuthStore } from '@/stores/authStore'
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

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    // Clear any corrupt localStorage data
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        // Validate the structure
        if (!parsed.state) {
          localStorage.removeItem('auth-storage')
        }
      }
    } catch (e) {
      localStorage.removeItem('auth-storage')
    }
    setMounted(true)
  }, [])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [mounted, isAuthenticated, router])

  const handleSuccess = () => {
    router.push('/dashboard')
  }

  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading state while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
              Job Board
            </h1>
          </Link>
          <p className="text-lg text-gray-600">Find your next opportunity</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm
          mode="login"
          onSuccess={handleSuccess}
          className="animate-fade-in"
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}