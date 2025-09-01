import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ImpactChartProps {
  data: any
}

export const ImpactChart: React.FC<ImpactChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'CO₂ Saved',
      value: data?.impactReport?.co2Saved || 0,
      unit: 'kg',
      color: '#22c55e'
    },
    {
      name: 'Energy Saved',
      value: data?.impactReport?.energyConservation || 0,
      unit: 'kWh',
      color: '#3b82f6'
    },
    {
      name: 'Water Saved',
      value: data?.impactReport?.waterConservation || 0,
      unit: 'L',
      color: '#06b6d4'
    }
  ]

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any, name: any, props: any) => [
              `${value} ${props.payload.unit}`,
              name
            ]}
          />
          <Bar 
            dataKey="value" 
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}