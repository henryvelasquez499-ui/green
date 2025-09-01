import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { 
  Activity, 
  Trophy, 
  TrendingUp, 
  Users, 
  Target,
  Leaf,
  Zap,
  Droplets
} from 'lucide-react'
import { analyticsApi, gamificationApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuthStore } from '../stores/authStore'

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'dashboard',
    () => analyticsApi.getDashboard({ timeframe: '30' })
  )

  const { data: progressData, isLoading: progressLoading } = useQuery(
    'progress',
    () => gamificationApi.getProgress()
  )

  const { data: achievementsData } = useQuery(
    'achievements',
    () => gamificationApi.getAchievements()
  )

  if (dashboardLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = [
    {
      name: 'Actions This Month',
      value: dashboardData?.summary?.totalActions || 0,
      icon: Activity,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Points Earned',
      value: dashboardData?.summary?.totalPoints || 0,
      icon: Trophy,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'CO₂ Saved (kg)',
      value: Math.round(dashboardData?.summary?.co2Saved || 0),
      icon: Leaf,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Current Streak',
      value: `${dashboardData?.summary?.currentStreak || 0} days`,
      icon: TrendingUp,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
      change: '+2 days',
      changeType: 'positive'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-neutral-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-neutral-600">
          Here's your sustainability impact overview for the past 30 days.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-neutral-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-neutral-500 ml-1">vs last month</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <Trophy className="h-5 w-5 text-accent-600 mr-2" />
                Recent Achievements
              </h3>
            </CardHeader>
            <CardContent>
              {achievementsData?.recentAchievements?.length > 0 ? (
                <div className="space-y-4">
                  {achievementsData.recentAchievements.slice(0, 3).map((achievement: any, index: number) => (
                    <motion.div
                      key={achievement.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-neutral-50"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{achievement.name}</p>
                        <p className="text-sm text-neutral-600">{achievement.description}</p>
                      </div>
                      <Badge variant="success" size="sm">{achievement.rarity}</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">No recent achievements</p>
                  <p className="text-sm text-neutral-400">Complete actions to earn badges!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Impact Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <Leaf className="h-5 w-5 text-success-600 mr-2" />
                Environmental Impact
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-success-50">
                  <div className="flex items-center space-x-3">
                    <Leaf className="h-8 w-8 text-success-600" />
                    <div>
                      <p className="font-medium text-success-900">CO₂ Reduced</p>
                      <p className="text-sm text-success-700">This month</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-success-900">
                    {Math.round(dashboardData?.summary?.co2Saved || 0)} kg
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary-50">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-8 w-8 text-secondary-600" />
                    <div>
                      <p className="font-medium text-secondary-900">Energy Saved</p>
                      <p className="text-sm text-secondary-700">This month</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-secondary-900">
                    {Math.round(dashboardData?.summary?.energySaved || 0)} kWh
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <Droplets className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Water Saved</p>
                      <p className="text-sm text-blue-700">This month</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {Math.round(dashboardData?.summary?.waterSaved || 0)} L
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.a
                href="/actions"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
              >
                <Activity className="h-8 w-8 text-primary-600" />
                <div>
                  <p className="font-medium text-neutral-900">Log Action</p>
                  <p className="text-sm text-neutral-600">Record sustainability activity</p>
                </div>
              </motion.a>

              <motion.a
                href="/challenges"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-secondary-300 hover:bg-secondary-50 transition-all duration-200"
              >
                <Target className="h-8 w-8 text-secondary-600" />
                <div>
                  <p className="font-medium text-neutral-900">Join Challenge</p>
                  <p className="text-sm text-neutral-600">Participate in competitions</p>
                </div>
              </motion.a>

              <motion.a
                href="/teams"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-accent-300 hover:bg-accent-50 transition-all duration-200"
              >
                <Users className="h-8 w-8 text-accent-600" />
                <div>
                  <p className="font-medium text-neutral-900">Find Team</p>
                  <p className="text-sm text-neutral-600">Collaborate with colleagues</p>
                </div>
              </motion.a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}