/**
 * @jest-environment node
 */

// Mock Next.js modules before importing routes
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(),
    json: jest.fn().mockImplementation(() => {
      if (init?.body) {
        return Promise.resolve(JSON.parse(init.body))
      }
      return Promise.resolve({})
    }),
    nextUrl: new URL(url)
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      cookies: {
        set: jest.fn(),
        delete: jest.fn()
      }
    }))
  }
}))

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}))

import { createServerClient } from '@supabase/ssr'
import { POST as registerHandler } from '../../../app/api/auth/register/route'
import { POST as loginHandler } from '../../../app/api/auth/login/route'
import { POST as logoutHandler, GET as logoutGetHandler } from '../../../app/api/auth/logout/route'
import { GET as sessionHandler } from '../../../app/api/auth/session/route'
import { NextRequest } from 'next/server'

describe('Authentication API Routes', () => {
  let mockSupabase: any
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
    }
    jest.clearAllMocks()
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        refreshSession: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }
    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1234567890,
        expires_in: 3600
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null })
          })
        })
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Account created successfully!')
      expect(data.user.email).toBe('test@example.com')
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback'
        }
      })
    })

    it('should return error for invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123'
        })
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
      expect(data.details.fieldErrors.email).toBeDefined()
    })

    it('should return error for password mismatch', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'different-password'
        })
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should return error if email already exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'existing-user' } })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('An account with this email already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1234567890,
        expires_in: 3600
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Login successful')
      expect(data.user.email).toBe('test@example.com')
      expect(data.session.access_token).toBe('access-token')
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should return error for invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid email or password')
    })

    it('should return error for unconfirmed email', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Please confirm your email address before logging in')
      expect(data.requiresEmailConfirmation).toBe(true)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token'
          }
        },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      })

      const response = await logoutHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Logged out successfully')
      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle logout when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      })

      const response = await logoutHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('No active session to log out from')
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled()
    })

    it('should support GET method for logout', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token'
          }
        },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'GET'
      })

      const response = await logoutGetHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Logged out successfully')
    })
  })

  describe('GET /api/auth/session', () => {
    it('should return session for authenticated user', async () => {
      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
        expires_in: 7200,
        token_type: 'bearer'
      }

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET'
      })

      const response = await sessionHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.authenticated).toBe(true)
      expect(data.user.email).toBe('test@example.com')
      expect(data.session.access_token).toBe('access-token')
    })

    it('should return unauthenticated for no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET'
      })

      const response = await sessionHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.authenticated).toBe(false)
      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
    })

    it('should refresh session when needed', async () => {
      const expiringSoon = Math.floor(Date.now() / 1000) + 1800 // 30 minutes from now

      const mockSession = {
        access_token: 'old-access-token',
        refresh_token: 'old-refresh-token',
        expires_at: expiringSoon,
        expires_in: 1800,
        token_type: 'bearer'
      }

      const newSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 7200,
        expires_in: 7200
      }

      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET'
      })

      const response = await sessionHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.authenticated).toBe(true)
      expect(data.session.access_token).toBe('new-access-token')
      expect(data.session.refreshed).toBe(true)
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })
  })
})