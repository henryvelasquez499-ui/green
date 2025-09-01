import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export const AdminRoute: React.FC = () => {
  const { user } = useAuthStore()

  if (!user || (user.role !== 'admin' && user.role !== 'sustainability_manager')) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}