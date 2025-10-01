import React, { useState } from 'react'
import { Navigation } from '@/components/organisms'
import { Button } from '@/components/atoms'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import clsx from 'clsx'

export interface DashboardLayoutProps {
  children: React.ReactNode
  user: User
  onLogout?: () => void
  className?: string
  activeTab?: 'dashboard' | 'my-jobs' | 'profile' | 'settings'
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  onLogout,
  className,
  activeTab = 'dashboard'
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      )
    },
    {
      id: 'my-jobs',
      label: 'My Jobs',
      href: '/dashboard/jobs',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/dashboard/profile',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/dashboard/settings',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )
    }
  ]

  return (
    <div className={clsx('min-h-screen bg-gray-50 flex flex-col', className)}>
      {/* Navigation Header */}
      <Navigation user={user} onLogout={onLogout} />

      <div className="flex flex-grow">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Sidebar */}
        <aside
          className={clsx(
            'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'pt-16 lg:pt-0'
          )}
        >
          <div className="h-full overflow-y-auto">
            <div className="px-4 py-6">
              {/* User Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Navigation */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={clsx(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <span
                      className={clsx(
                        'mr-3',
                        activeTab === item.id ? 'text-blue-700' : 'text-gray-400'
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="mt-3 space-y-2">
                  <Link href="/jobs/new">
                    <Button variant="primary" fullWidth>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Post New Job
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="secondary" fullWidth>
                      Browse All Jobs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout