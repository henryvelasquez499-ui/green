import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Settings, Save, RotateCcw } from 'lucide-react'
import { adminApi } from '../../services/api'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const queryClient = useQueryClient()

  const { data: settingsData, isLoading } = useQuery(
    'admin-settings',
    () => adminApi.getSettings(),
    {
      onSuccess: (data) => {
        const settingsMap = Object.keys(data.settings).reduce((acc, key) => {
          acc[key] = data.settings[key].value
          return acc
        }, {} as Record<string, any>)
        setSettings(settingsMap)
      }
    }
  )

  const updateSettingsMutation = useMutation(
    (data: any) => adminApi.updateSettings(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-settings')
        setHasChanges(false)
        toast.success('Settings updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update settings')
      }
    }
  )

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    updateSettingsMutation.mutate({ settings })
  }

  const handleReset = () => {
    if (settingsData?.settings) {
      const settingsMap = Object.keys(settingsData.settings).reduce((acc, key) => {
        acc[key] = settingsData.settings[key].value
        return acc
      }, {} as Record<string, any>)
      setSettings(settingsMap)
      setHasChanges(false)
    }
  }

  const renderSettingInput = (key: string, setting: any) => {
    const value = settings[key] || setting.value

    switch (setting.dataType) {
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => handleSettingChange(key, e.target.checked.toString())}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <span className="ml-2 text-sm text-neutral-900">Enabled</span>
          </label>
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        )
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        )
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
          <h1 className="text-3xl font-bold text-neutral-900">System Settings</h1>
          <p className="mt-2 text-neutral-600">
            Configure platform settings and preferences
          </p>
        </div>
        {hasChanges && (
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateSettingsMutation.isLoading}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(settingsData?.settings || {}).map(([key, setting]: [string, any], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-sm text-neutral-600 mt-1">
                          {setting.description}
                        </p>
                      </div>
                      
                      <div>
                        {renderSettingInput(key, setting)}
                      </div>

                      {setting.updatedAt && (
                        <p className="text-xs text-neutral-500">
                          Last updated: {format(new Date(setting.updatedAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}