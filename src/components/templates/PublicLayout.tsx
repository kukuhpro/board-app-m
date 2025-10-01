import React from 'react'
import { Navigation } from '@/components/organisms'
import type { User } from '@supabase/supabase-js'
import clsx from 'clsx'

export interface PublicLayoutProps {
  children: React.ReactNode
  user?: User | null
  onLogout?: () => void
  className?: string
}

const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  user,
  onLogout,
  className
}) => {
  return (
    <div className={clsx('min-h-screen bg-gray-50 flex flex-col', className)}>
      {/* Navigation Header */}
      <Navigation user={user} onLogout={onLogout} />

      {/* Main Content */}
      <main id="main-content" className="flex-grow" role="main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3" id="footer-company">
                JobBoard
              </h3>
              <p className="text-sm text-gray-600">
                Connect with opportunities. Find your next great role.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Browse Jobs
                  </a>
                </li>
                <li>
                  <a
                    href="/jobs/new"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Post a Job
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/cookies"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} JobBoard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout