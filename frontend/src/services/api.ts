import axios, { AxiosResponse } from 'axios'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const { refreshToken, logout } = useAuthStore.getState()
      
      if (refreshToken) {
        try {
          const response = await authApi.refreshToken(refreshToken)
          useAuthStore.setState({ accessToken: response.accessToken })
          originalRequest.headers.Authorization = `Bearer ${response.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          logout()
          window.location.href = '/auth/login'
        }
      } else {
        logout()
        window.location.href = '/auth/login'
      }
    }

    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      toast.error(error.response?.data?.error || 'An error occurred')
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/users/login', data)
    return response.data
  },

  register: async (data: any) => {
    const response = await api.post('/users/register', data)
    return response.data
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/users/logout', { refreshToken })
    return response.data
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data)
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/users/forgot-password', { email })
    return response.data
  },

  resetPassword: async (data: { token: string; password: string }) => {
    const response = await api.post('/users/reset-password', data)
    return response.data
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/users/verify-email', { token })
    return response.data
  },
}

// Actions API
export const actionsApi = {
  getActions: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/actions', { params })
    return response.data
  },

  createAction: async (data: any) => {
    const response = await api.post('/actions', data)
    return response.data
  },

  updateAction: async (id: string, data: any) => {
    const response = await api.put(`/actions/${id}`, data)
    return response.data
  },

  deleteAction: async (id: string) => {
    const response = await api.delete(`/actions/${id}`)
    return response.data
  },

  getCategories: async () => {
    const response = await api.get('/actions/categories')
    return response.data
  },

  exportActions: async (params?: { format?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/actions/export', { params })
    return response.data
  },
}

// Challenges API
export const challengesApi = {
  getChallenges: async (params?: { status?: string; type?: string }) => {
    const response = await api.get('/challenges', { params })
    return response.data
  },

  getChallenge: async (id: string) => {
    const response = await api.get(`/challenges/${id}`)
    return response.data
  },

  joinChallenge: async (id: string) => {
    const response = await api.post(`/challenges/${id}/join`)
    return response.data
  },

  leaveChallenge: async (id: string) => {
    const response = await api.delete(`/challenges/${id}/leave`)
    return response.data
  },

  getChallengeLeaderboard: async (id: string) => {
    const response = await api.get(`/challenges/${id}/leaderboard`)
    return response.data
  },
}

// Teams API
export const teamsApi = {
  getTeams: async (params?: { department?: string }) => {
    const response = await api.get('/teams', { params })
    return response.data
  },

  getTeam: async (id: string) => {
    const response = await api.get(`/teams/${id}`)
    return response.data
  },

  createTeam: async (data: any) => {
    const response = await api.post('/teams', data)
    return response.data
  },

  joinTeam: async (id: string) => {
    const response = await api.post(`/teams/${id}/join`)
    return response.data
  },

  leaveTeam: async (id: string) => {
    const response = await api.delete(`/teams/${id}/leave`)
    return response.data
  },

  getTeamMembers: async (id: string) => {
    const response = await api.get(`/teams/${id}/members`)
    return response.data
  },
}

// Gamification API
export const gamificationApi = {
  getPoints: async () => {
    const response = await api.get('/gamification/points')
    return response.data
  },

  getBadges: async () => {
    const response = await api.get('/gamification/badges')
    return response.data
  },

  claimBadge: async (badgeId: string) => {
    const response = await api.post('/gamification/badges/claim', { badgeId })
    return response.data
  },

  getLeaderboard: async (params?: { timeframe?: string; limit?: number }) => {
    const response = await api.get('/gamification/leaderboard', { params })
    return response.data
  },

  getProgress: async () => {
    const response = await api.get('/gamification/progress')
    return response.data
  },

  getAchievements: async () => {
    const response = await api.get('/gamification/achievements')
    return response.data
  },

  celebrate: async (data: { achievementType: string; achievementId: string }) => {
    const response = await api.post('/gamification/celebrate', data)
    return response.data
  },
}

// Analytics API
export const analyticsApi = {
  getDashboard: async (params?: { timeframe?: string }) => {
    const response = await api.get('/analytics/dashboard', { params })
    return response.data
  },

  getImpact: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/impact', { params })
    return response.data
  },

  getTrends: async () => {
    const response = await api.get('/analytics/trends')
    return response.data
  },

  trackEvent: async (data: { eventType: string; eventData?: any; sessionId?: string }) => {
    const response = await api.post('/analytics/track', data)
    return response.data
  },

  exportAnalytics: async (params?: { format?: string; startDate?: string; endDate?: string; includePersonalData?: boolean }) => {
    const response = await api.get('/analytics/export', { params })
    return response.data
  },
}

// Admin API
export const adminApi = {
  // Users
  getUsers: async (params?: { limit?: number; offset?: number; role?: string; status?: string; search?: string }) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  createUser: async (data: any) => {
    const response = await api.post('/admin/users', data)
    return response.data
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data)
    return response.data
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data
  },

  getUserActivity: async (id: string, params?: { limit?: number; offset?: number }) => {
    const response = await api.get(`/admin/users/${id}/activity`, { params })
    return response.data
  },

  // Actions
  getAdminActions: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/admin/actions', { params })
    return response.data
  },

  verifyAction: async (id: string, data: { status: string; notes?: string }) => {
    const response = await api.put(`/admin/actions/${id}/verify`, data)
    return response.data
  },

  bulkVerifyActions: async (data: { actionIds: string[]; status: string; notes?: string }) => {
    const response = await api.post('/admin/actions/bulk-verify', data)
    return response.data
  },

  // Challenges
  getAdminChallenges: async () => {
    const response = await api.get('/admin/challenges')
    return response.data
  },

  createChallenge: async (data: any) => {
    const response = await api.post('/admin/challenges', data)
    return response.data
  },

  // Reports
  getESGReport: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/reports/esg', { params })
    return response.data
  },

  getAuditLogs: async (params?: { limit?: number; offset?: number; adminId?: string; action?: string }) => {
    const response = await api.get('/admin/audit-logs', { params })
    return response.data
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/admin/settings')
    return response.data
  },

  updateSettings: async (data: { settings: Record<string, any> }) => {
    const response = await api.put('/admin/settings', data)
    return response.data
  },
}

export default api