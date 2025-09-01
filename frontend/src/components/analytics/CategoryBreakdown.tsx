import React from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface CategoryBreakdownProps {
  data: any[]
  isLoading: boolean
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ data, isLoading }) => {
  const chartData = data?.map((category: any) => ({
    name: category.name,
    value: parseInt(category.total_points || 0),
    color: category.color || '#22c55e',
    actions: parseInt(category.action_count || 0)
  })) || []

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-neutral-900">Category Breakdown</h3>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      `${value} points (${props.payload.actions} actions)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-3">
              {chartData.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-50"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-neutral-900">{category.name}</p>
                      <p className="text-sm text-neutral-600">{category.actions} actions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">{category.value}</p>
                    <p className="text-sm text-neutral-600">points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}