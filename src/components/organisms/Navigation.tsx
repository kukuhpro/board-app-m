import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/atoms'
import { User } from '@supabase/supabase-js'
import clsx from 'clsx'

export interface NavigationProps {
  user?: User | null
  onLogout?: () => void
  className?: string
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout, className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    }
  }

  return (
    <nav className={clsx('bg-white shadow-lg', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">JobBoard</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                Browse Jobs
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    My Jobs
                  </Link>
                  <Link
                    href="/jobs/new"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    Post a Job
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  Welcome, <span className="font-medium">{user.email}</span>
                </span>
                <Button variant="secondary" size="small" onClick={handleLogout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="secondary" size="small">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="small">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMobileMenuOpen}
              aria-label="Main menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={clsx(
          'md:hidden transition-all duration-300 ease-in-out',
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Browse Jobs
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Jobs
              </Link>
              <Link
                href="/jobs/new"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Post a Job
              </Link>
              <div className="pt-4 pb-2 border-t border-gray-200">
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 pb-2 border-t border-gray-200 space-y-2">
              <Link
                href="/auth/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation