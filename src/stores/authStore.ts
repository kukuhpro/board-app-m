import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/domain/entities/User'

interface AuthState {
  // Auth state
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: (user: User) => void
  logout: () => void
  updateUser: (userData: Partial<{id: string, email: string, metadata: Record<string, any>}>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      login: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (!currentUser) return

        try {
          const updatedUser = new User({
            id: userData.id || currentUser.getId(),
            email: userData.email || currentUser.getEmail(),
            createdAt: currentUser.getCreatedAt(),
            metadata: userData.metadata || currentUser.getMetadata()
          })

          set({
            user: updatedUser
          })
        } catch (error) {
          console.error('Error updating user:', error)
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user ? state.user.toJSON() : null,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Reconstruct User entity from persisted data
        if (state) {
          if (state.user) {
            try {
              const userData = state.user as any
              state.user = new User({
                id: userData.id,
                email: userData.email,
                createdAt: new Date(userData.createdAt),
                metadata: userData.metadata
              })
              state.isAuthenticated = true
            } catch (error) {
              console.error('Error rehydrating user:', error)
              state.user = null
              state.isAuthenticated = false
            }
          }
          state.isLoading = false
        }
      }
    }
  )
)

// Selectors for convenience
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsLoading = () => useAuthStore((state) => state.isLoading)

// Auth actions
export const useAuthActions = () => ({
  setUser: useAuthStore((state) => state.setUser),
  setLoading: useAuthStore((state) => state.setLoading),
  login: useAuthStore((state) => state.login),
  logout: useAuthStore((state) => state.logout),
  updateUser: useAuthStore((state) => state.updateUser)
})