import { renderHook, act } from '@testing-library/react'
import { useAuthStore, useUser, useIsAuthenticated, useIsLoading, useAuthActions } from '@/stores/authStore'
import { User } from '@/domain/entities/User'

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn
}))

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('setUser action', () => {
    it('should set user and update authentication state', () => {
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date()
      })

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(user)
      })

      expect(result.current.user).toBe(user)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should clear user and update authentication state when passed null', () => {
      // First set a user
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date()
      })

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(user)
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Then clear the user
      act(() => {
        result.current.setUser(null)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('login action', () => {
    it('should login user and set authentication state', () => {
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date()
      })

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login(user)
      })

      expect(result.current.user).toBe(user)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('logout action', () => {
    it('should logout user and clear authentication state', () => {
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date()
      })

      const { result } = renderHook(() => useAuthStore())

      // First login
      act(() => {
        result.current.login(user)
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Then logout
      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('setLoading action', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('updateUser action', () => {
    it('should update user with new data', () => {
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date(),
        metadata: { role: 'user' }
      })

      const { result } = renderHook(() => useAuthStore())

      // First set a user
      act(() => {
        result.current.setUser(user)
      })

      // Then update the user
      act(() => {
        result.current.updateUser({
          email: 'newemail@example.com',
          metadata: { role: 'admin' }
        })
      })

      expect(result.current.user?.getEmail()).toBe('newemail@example.com')
      expect(result.current.user?.getMetadata()).toEqual({ role: 'admin' })
      expect(result.current.user?.getId()).toBe('user123') // Should remain unchanged
    })

    it('should handle partial updates', () => {
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date(),
        metadata: { role: 'user' }
      })

      const { result } = renderHook(() => useAuthStore())

      // First set a user
      act(() => {
        result.current.setUser(user)
      })

      // Then update only email
      act(() => {
        result.current.updateUser({
          email: 'newemail@example.com'
        })
      })

      expect(result.current.user?.getEmail()).toBe('newemail@example.com')
      expect(result.current.user?.getMetadata()).toEqual({ role: 'user' }) // Should remain unchanged
    })

    it('should do nothing if no user is set', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.updateUser({
          email: 'newemail@example.com'
        })
      })

      expect(result.current.user).toBeNull()
    })

    it('should handle invalid user data gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date()
      })

      const { result } = renderHook(() => useAuthStore())

      // First set a user
      act(() => {
        result.current.setUser(user)
      })

      // Then try to update with invalid email
      act(() => {
        result.current.updateUser({
          email: 'invalid-email'
        })
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error updating user:', expect.any(Error))
      expect(result.current.user?.getEmail()).toBe('test@example.com') // Should remain unchanged

      consoleSpy.mockRestore()
    })
  })

  describe('selectors', () => {
    it('should provide user selector', () => {
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date()
      })

      const { result: userResult } = renderHook(() => useUser())
      const { result: storeResult } = renderHook(() => useAuthStore())

      act(() => {
        storeResult.current.setUser(user)
      })

      expect(userResult.current).toBe(user)
    })

    it('should provide isAuthenticated selector', () => {
      const user = new User({
        id: 'user123',
        email: 'test@example.com',
        createdAt: new Date()
      })

      const { result: authResult } = renderHook(() => useIsAuthenticated())
      const { result: storeResult } = renderHook(() => useAuthStore())

      expect(authResult.current).toBe(false)

      act(() => {
        storeResult.current.setUser(user)
      })

      expect(authResult.current).toBe(true)
    })

    it('should provide isLoading selector', () => {
      const { result: loadingResult } = renderHook(() => useIsLoading())
      const { result: storeResult } = renderHook(() => useAuthStore())

      expect(loadingResult.current).toBe(true)

      act(() => {
        storeResult.current.setLoading(false)
      })

      expect(loadingResult.current).toBe(false)
    })

    it('should provide auth actions selector', () => {
      const { result } = renderHook(() => useAuthActions())

      expect(typeof result.current.setUser).toBe('function')
      expect(typeof result.current.setLoading).toBe('function')
      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.updateUser).toBe('function')
    })
  })
})