import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Activity, 
  Trophy, 
  Users, 
  TrendingUp, 
  BarChart3, 
  User,
  Settings,
  Shield,
  FileText,
  Target
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Actions', href: '/actions', icon: Activity },
  { name: 'Challenges', href: '/challenges', icon: Target },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Profile', href: '/profile', icon: User },
]

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Action Verification', href: '/admin/actions', icon: Activity },
  { name: 'Challenge Management', href: '/admin/challenges', icon: Target },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'sustainability_manager'

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-neutral-200 px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">GreenLoop</span>
          </motion.div>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            {/* Main Navigation */}
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item, index) => {
                  const isActive = location.pathname === item.href
                  return (
                    <motion.li
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <NavLink
                        to={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                            : 'text-neutral-700 hover:text-primary-700 hover:bg-neutral-50'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-colors',
                            isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-primary-600'
                          )}
                        />
                        {item.name}
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute right-0 w-0.5 h-6 bg-primary-600 rounded-l"
                          />
                        )}
                      </NavLink>
                    </motion.li>
                  )
                })}
              </ul>
            </li>

            {/* Admin Navigation */}
            {isAdmin && (
              <li>
                <div className="text-xs font-semibold leading-6 text-neutral-400 uppercase tracking-wide">
                  Administration
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {adminNavigation.map((item, index) => {
                    const isActive = location.pathname === item.href
                    return (
                      <motion.li
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (navigation.length + index) * 0.1 }}
                      >
                        <NavLink
                          to={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-secondary-50 text-secondary-700 border-r-2 border-secondary-600'
                              : 'text-neutral-700 hover:text-secondary-700 hover:bg-neutral-50'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0 transition-colors',
                              isActive ? 'text-secondary-600' : 'text-neutral-400 group-hover:text-secondary-600'
                            )}
                          />
                          {item.name}
                        </NavLink>
                      </motion.li>
                    )
                  })}
                </ul>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  )
}