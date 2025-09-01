import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { 
  Users, 
  Activity, 
  Target, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Award
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export const AdminDashboardPage: React.FC = () => {
  const { data: usersData, isLoading: usersLoading } = useQuery(
    'admin-users',
    () => adminApi.getUsers({ limit: 10 })
  )

  const { data: actionsData, isLoading: actionsLoading } = useQuery(
    'admin-actions',
    () => adminApi.getAdminActions({ limit: 10 })
  )

  const { data: challengesData, isLoading: challengesLoading } = useQuery(
    'admin-challenges',
    () => adminApi.getAdminChallenges()
  )

  const { data: esgData, isLoading: esgLoading } = useQuery(
    'esg-report',
    () => adminApi.getESGReport()
  )

  const stats = [
    {
      name: 'Total Users',
      value: usersData?.users?.length || 0,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Pending Actions',
      value: actionsData?.actions?.filter((a: any) => a.verification_status === 'pending').length || 0,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
      change: '-12%',
      changeType: 'negative'
    },
    {
      name: 'Active Challenges',
      value: challengesData?.challenges?.filter((c: any) => c.is_active).length || 0,
      icon: Target,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
      change: '+2',
      changeType: 'positive'
    },
    {
      name: 'Total CO₂ Saved',
      value: `${Math.round(esgData?.companyMetrics?.totalCO2Saved || 0)} kg`,
      icon: TrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
      change: '+18%',
      changeType: 'positive'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-2 text-neutral-600">
          Overview of platform activity and user engagement
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
        {/* Recent Actions Requiring Verification */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <Activity className="h-5 w-5 text-warning-600 mr-2" />
                Pending Verifications
              </h3>
            </CardHeader>
            <CardContent>
              {actionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-3">
                  {actionsData?.actions
                    ?.filter((action: any) => action.verification_status === 'pending')
                    ?.slice(0, 5)
                    ?.map((action: any, index: number) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{action.title}</p>
                        <p className="text-sm text-neutral-600">
                          by {action.first_name} {action.last_name}
                        </p>
                      </div>
                      <Badge variant="warning" size="sm">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </motion.div>
                  ))}
                  {(!actionsData?.actions || actionsData.actions.filter((a: any) => a.verification_status === 'pending').length === 0) && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-success-300 mx-auto mb-4" />
                      <p className="text-neutral-500">All actions verified!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-success-600 mr-2" />
                Platform Activity
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-success-50">
                  <div>
                    <p className="font-medium text-success-900">Actions Today</p>
                    <p className="text-sm text-success-700">Verified sustainability actions</p>
                  </div>
                  <p className="text-2xl font-bold text-success-900">
                    {actionsData?.actions?.filter((a: any) => 
                      new Date(a.created_at).toDateString() === new Date().toDateString()
                    ).length || 0}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary-50">
                  <div>
                    <p className="font-medium text-secondary-900">New Users</p>
                    <p className="text-sm text-secondary-700">This week</p>
                  </div>
                  <p className="text-2xl font-bold text-secondary-900">
                    {usersData?.users?.filter((u: any) => 
                      new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length || 0}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent-50">
                  <div>
                    <p className="font-medium text-accent-900">Active Challenges</p>
                    <p className="text-sm text-accent-700">Currently running</p>
                  </div>
                  <p className="text-2xl font-bold text-accent-900">
                    {challengesData?.challenges?.filter((c: any) => c.is_active).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}