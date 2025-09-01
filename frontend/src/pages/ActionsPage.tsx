import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Filter, Download, Calendar, Tag } from 'lucide-react'
import { actionsApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ActionForm } from '../components/actions/ActionForm'
import { ActionList } from '../components/actions/ActionList'
import { ActionFilters } from '../components/actions/ActionFilters'
import toast from 'react-hot-toast'

export const ActionsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    dateRange: ''
  })
  const queryClient = useQueryClient()

  const { data: actionsData, isLoading } = useQuery(
    ['actions', filters],
    () => actionsApi.getActions({ limit: 50, offset: 0 })
  )

  const { data: categoriesData } = useQuery(
    'categories',
    () => actionsApi.getCategories()
  )

  const createActionMutation = useMutation(
    (data: any) => actionsApi.createAction(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('actions')
        setIsCreateModalOpen(false)
        toast.success('Action logged successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create action')
      }
    }
  )

  const handleExport = async () => {
    try {
      const data = await actionsApi.exportActions({ format: 'csv' })
      // Handle CSV download
      const blob = new Blob([data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sustainability-actions.csv'
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Actions exported successfully!')
    } catch (error) {
      toast.error('Failed to export actions')
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
          <h1 className="text-3xl font-bold text-neutral-900">Sustainability Actions</h1>
          <p className="mt-2 text-neutral-600">
            Track and manage your environmental impact activities
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Action
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ActionFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categoriesData?.categories || []}
        />
      </motion.div>

      {/* Actions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ActionList
            actions={actionsData?.actions || []}
            categories={categoriesData?.categories || []}
          />
        )}
      </motion.div>

      {/* Create Action Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log New Action"
        size="lg"
      >
        <ActionForm
          categories={categoriesData?.categories || []}
          onSubmit={(data) => createActionMutation.mutate(data)}
          isLoading={createActionMutation.isLoading}
        />
      </Modal>
    </div>
  )
}