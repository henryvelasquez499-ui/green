import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'employee' | 'admin' | 'sustainability_manager'
  department?: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  checkAuth: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  department?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password })
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
          })
        } catch (error) {
          throw error
        }
      },

      register: async (data: RegisterData) => {
        try {
          await authApi.register(data)
        } catch (error) {
          throw error
        }
      },

      logout: () => {
        const { refreshToken } = get()
        if (refreshToken) {
          authApi.logout(refreshToken).catch(() => {})
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          const response = await authApi.updateProfile(data)
          set(state => ({
            user: state.user ? { ...state.user, ...response.user } : null
          }))
        } catch (error) {
          throw error
        }
      },

      checkAuth: async () => {
        try {
          const { accessToken } = get()
          if (!accessToken) {
            set({ isLoading: false })
            return
          }

          const response = await authApi.getProfile()
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

// Initialize auth check
useAuthStore.getState().checkAuth()