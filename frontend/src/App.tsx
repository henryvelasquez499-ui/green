import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './stores/authStore'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'

// Main Pages
import { DashboardPage } from './pages/DashboardPage'
import { ActionsPage } from './pages/ActionsPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { TeamsPage } from './pages/TeamsPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ProfilePage } from './pages/ProfilePage'

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminActionsPage } from './pages/admin/AdminActionsPage'
import { AdminChallengesPage } from './pages/admin/AdminChallengesPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'

// Layout
import { Layout } from './components/layout/Layout'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

function App() {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path="/auth/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/auth/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        } />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="actions" element={<ActionsPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminRoute />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="actions" element={<AdminActionsPage />} />
            <Route path="challenges" element={<AdminChallengesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App