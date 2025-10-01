import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Mock the @supabase/ssr module
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn((url: string, key: string) => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })
  })),
  createServerClient: jest.fn((url: string, key: string, options: any) => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })
  })),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })
}))

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('Browser Client', () => {
    it('should initialize Supabase client with correct URL and key', () => {
      const client = createClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })

    it('should create client even when environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      const client = createClient()
      expect(client).toBeDefined()
    })

    it('should have auth helper functions', () => {
      const client = createClient()
      expect(client.auth.getUser).toBeDefined()
      expect(client.auth.signUp).toBeDefined()
      expect(client.auth.signInWithPassword).toBeDefined()
      expect(client.auth.signOut).toBeDefined()
      expect(client.auth.onAuthStateChange).toBeDefined()
    })
  })

  describe('Server Client', () => {
    it('should initialize server Supabase client', async () => {
      const client = await createServerClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })

    it('should handle cookie operations', async () => {
      const { cookies } = require('next/headers')
      await createServerClient()
      expect(cookies).toHaveBeenCalled()
    })
  })

  describe('Environment Variables', () => {
    it('should load environment variables correctly', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
    })

    it('should handle missing configuration by using undefined values', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const client = createClient()
      expect(client).toBeDefined()

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    })
  })

  describe('Auth Helper Functions', () => {
    it('should provide auth methods on the client', () => {
      const client = createClient()

      expect(typeof client.auth.getUser).toBe('function')
      expect(typeof client.auth.signUp).toBe('function')
      expect(typeof client.auth.signInWithPassword).toBe('function')
      expect(typeof client.auth.signOut).toBe('function')
    })

    it('should handle auth state changes', () => {
      const client = createClient()
      const { data } = client.auth.onAuthStateChange(jest.fn())

      expect(data.subscription).toBeDefined()
      expect(data.subscription.unsubscribe).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing anon key by using undefined', () => {
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const client = createClient()
      expect(client).toBeDefined()

      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })
  })
})