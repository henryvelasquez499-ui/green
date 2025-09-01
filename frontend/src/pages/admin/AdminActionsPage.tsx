import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Activity, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { adminApi } from '../../services/api'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { VerificationModal } from '../../components/admin/VerificationModal'
import toast from 'react-hot-toast'

export const AdminActionsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: actionsData, isLoading } = useQuery(
    ['admin-actions', statusFilter],
    () => adminApi.getAdminActions({ status: statusFilter, limit: 100 })
  )

  const verifyActionMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => adminApi.verifyAction(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-actions')
        setIsVerificationModalOpen(false)
        setSelectedAction(null)
        toast.success('Action verification updated!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to verify action')
      }
    }
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-error-600" />
      default:
        return <Clock className="h-4 w-4 text-neutral-400" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  const handleVerify = (action: any) => {
    setSelectedAction(action)
    setIsVerificationModalOpen(true)
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
          <h1 className="text-3xl font-bold text-neutral-900">Action Verification</h1>
          <p className="mt-2 text-neutral-600">
            Review and verify user-submitted sustainability actions
          </p>
        </div>
      </motion.div>

      {/* Status Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Status:</span>
              <div className="flex space-x-2">
                {[
                  { value: 'pending', label: 'Pending', count: actionsData?.actions?.filter((a: any) => a.verification_status === 'pending').length || 0 },
                  { value: 'verified', label: 'Verified', count: actionsData?.actions?.filter((a: any) => a.verification_status === 'verified').length || 0 },
                  { value: 'rejected', label: 'Rejected', count: actionsData?.actions?.filter((a: any) => a.verification_status === 'rejected').length || 0 },
                  { value: 'all', label: 'All', count: actionsData?.actions?.length || 0 }
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      statusFilter === status.value
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{status.label}</span>
                    <Badge variant="default" size="sm">{status.count}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
        ) : actionsData?.actions?.length > 0 ? (
          <div className="space-y-4">
            {actionsData.actions.map((action: any, index: number) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card hover>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {action.title}
                          </h3>
                          <Badge 
                            variant={getStatusVariant(action.verification_status)}
                            size="sm"
                          >
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(action.verification_status)}
                              <span className="capitalize">{action.verification_status}</span>
                            </div>
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
                          <span>by {action.first_name} {action.last_name}</span>
                          <span>•</span>
                          <span>{action.category_name}</span>
                          <span>•</span>
                          <span>{format(new Date(action.action_date), 'MMM d, yyyy')}</span>
                        </div>

                        {action.description && (
                          <p className="text-neutral-600 mb-3">{action.description}</p>
                        )}

                        {action.impact_value && action.impact_unit && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium text-neutral-900">Impact:</span>
                            <span className="text-neutral-600">
                              {action.impact_value} {action.impact_unit}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-accent-600">
                            {action.points_earned} pts
                          </p>
                        </div>
                        
                        {action.verification_status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleVerify(action)}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>

                    {action.verification_notes && (
                      <div className="mt-4 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                        <p className="text-sm text-neutral-600">
                          <strong>Verification Notes:</strong> {action.verification_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No actions found</h3>
              <p className="text-neutral-600">
                {statusFilter === 'pending' 
                  ? 'All actions have been reviewed!'
                  : 'No actions match the current filter.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Verification Modal */}
      <Modal
        isOpen={isVerificationModalOpen}
        onClose={() => {
          setIsVerificationModalOpen(false)
          setSelectedAction(null)
        }}
        title="Verify Action"
        size="lg"
      >
        {selectedAction && (
          <VerificationModal
            action={selectedAction}
            onSubmit={(data) => verifyActionMutation.mutate({ id: selectedAction.id, data })}
            isLoading={verifyActionMutation.isLoading}
          />
        )}
      </Modal>
    </div>
  )
}