import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react'
import { analyticsApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ImpactChart } from '../components/analytics/ImpactChart'
import { TrendsChart } from '../components/analytics/TrendsChart'
import { CategoryBreakdown } from '../components/analytics/CategoryBreakdown'

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState('90')

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    ['analytics-dashboard', timeframe],
    () => analyticsApi.getDashboard({ timeframe })
  )

  const { data: impactData, isLoading: impactLoading } = useQuery(
    'analytics-impact',
    () => analyticsApi.getImpact()
  )

  const { data: trendsData, isLoading: trendsLoading } = useQuery(
    'analytics-trends',
    () => analyticsApi.getTrends()
  )

  const handleExport = async () => {
    try {
      await analyticsApi.exportAnalytics({ 
        format: 'json',
        includePersonalData: true 
      })
      toast.success('Analytics exported successfully!')
    } catch (error) {
      toast.error('Failed to export analytics')
    }
  }

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
          <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
          <p className="mt-2 text-neutral-600">
            Deep insights into your sustainability journey and environmental impact
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </motion.div>

      {/* Timeframe Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Time Period:</span>
              <div className="flex space-x-2">
                {[
                  { value: '30', label: '30 Days' },
                  { value: '90', label: '90 Days' },
                  { value: '365', label: '1 Year' },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setTimeframe(period.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      timeframe === period.value
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Impact Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
                Environmental Impact
              </h3>
            </CardHeader>
            <CardContent>
              {impactLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <ImpactChart data={impactData} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Trends Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-secondary-600 mr-2" />
                Activity Trends
              </h3>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <TrendsChart data={trendsData} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <CategoryBreakdown 
          data={dashboardData?.categoryBreakdown || []}
          isLoading={dashboardLoading}
        />
      </motion.div>
    </div>
  )
}