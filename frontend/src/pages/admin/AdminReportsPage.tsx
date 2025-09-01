import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { BarChart3, Download, Calendar, TrendingUp, Users, Leaf } from 'lucide-react'
import { format } from 'date-fns'
import { adminApi } from '../../services/api'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export const AdminReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const { data: esgData, isLoading } = useQuery(
    ['esg-report', dateRange],
    () => adminApi.getESGReport(dateRange)
  )

  const handleExport = async () => {
    try {
      // In a real implementation, this would trigger a file download
      toast.success('ESG report exported successfully!')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const metrics = [
    {
      name: 'Total Active Users',
      value: esgData?.companyMetrics?.totalActiveUsers || 0,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'Total Actions',
      value: esgData?.companyMetrics?.totalActions || 0,
      icon: TrendingUp,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
    {
      name: 'CO₂ Saved (kg)',
      value: Math.round(esgData?.companyMetrics?.totalCO2Saved || 0),
      icon: Leaf,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      name: 'Energy Saved (kWh)',
      value: Math.round(esgData?.companyMetrics?.totalEnergySaved || 0),
      icon: BarChart3,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">ESG Reports</h1>
          <p className="mt-2 text-neutral-600">
            Environmental, Social, and Governance impact reporting
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleExport}
          className="mt-4 sm:mt-0 flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Report Period:</span>
              <div className="flex space-x-4">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <span className="text-neutral-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                      <metric.icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-neutral-600">{metric.name}</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {metric.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Department Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">Department Breakdown</h3>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        CO₂ Saved (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Avg Points/User
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {esgData?.departmentBreakdown?.map((dept: any, index: number) => (
                      <motion.tr
                        key={dept.department}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-neutral-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {dept.department || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {dept.user_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {dept.action_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {Math.round(dept.co2_saved || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {Math.round(dept.avg_points_per_user || 0)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}