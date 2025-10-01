import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ToastProvider } from '../../src/contexts/ToastContext'
import { User } from '@supabase/supabase-js'

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    range: jest.fn().mockReturnThis(),
  })),
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Test user fixtures
export const testUsers = {
  employer: {
    id: 'employer-123',
    email: 'employer@test.com',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: { name: 'Test Employer' },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
  } as User,
  jobSeeker: {
    id: 'seeker-456',
    email: 'seeker@test.com',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: { name: 'Test Job Seeker' },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
  } as User,
}

// Test job fixtures
export const testJobs = {
  fullTimeJob: {
    id: 'job-001',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    description: 'We are looking for a senior software engineer to join our team.',
    location: 'San Francisco, CA',
    jobType: 'Full-Time',
    userId: 'employer-123',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  partTimeJob: {
    id: 'job-002',
    title: 'Part-Time Designer',
    company: 'Design Studio',
    description: 'Seeking a creative designer for part-time work.',
    location: 'Remote',
    jobType: 'Part-Time',
    userId: 'employer-123',
    createdAt: '2024-01-16T10:00:00.000Z',
    updatedAt: '2024-01-16T10:00:00.000Z',
  },
  contractJob: {
    id: 'job-003',
    title: 'Contract Developer',
    company: 'Startup Inc',
    description: '3-month contract for a full-stack developer.',
    location: 'New York, NY',
    jobType: 'Contract',
    userId: 'employer-456',
    createdAt: '2024-01-17T10:00:00.000Z',
    updatedAt: '2024-01-17T10:00:00.000Z',
  },
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { user, ...renderOptions } = options || {}

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Utility functions for common test scenarios
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    const loadingElements = document.querySelectorAll('[aria-busy="true"]')
    expect(loadingElements.length).toBe(0)
  })
}

export const fillJobForm = async (user: any, jobData: Partial<typeof testJobs.fullTimeJob>) => {
  const { screen } = await import('@testing-library/react')

  if (jobData.title) {
    await user.type(screen.getByLabelText(/title/i), jobData.title)
  }
  if (jobData.company) {
    await user.type(screen.getByLabelText(/company/i), jobData.company)
  }
  if (jobData.description) {
    await user.type(screen.getByLabelText(/description/i), jobData.description)
  }
  if (jobData.location) {
    await user.type(screen.getByLabelText(/location/i), jobData.location)
  }
  if (jobData.jobType) {
    await user.selectOptions(screen.getByLabelText(/job type/i), jobData.jobType)
  }
}

export const mockAuthenticatedUser = (user: User = testUsers.employer) => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  })
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: {
      session: {
        user,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
      },
    },
    error: null,
  })
}

export const mockUnauthenticatedUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'