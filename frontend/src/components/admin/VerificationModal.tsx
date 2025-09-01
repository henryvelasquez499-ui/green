import React from 'react'
import { useForm } from 'react-hook-form'
import { CheckCircle, XCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface VerificationModalProps {
  action: any
  onSubmit: (data: any) => void
  isLoading: boolean
}

interface VerificationForm {
  status: 'verified' | 'rejected'
  notes?: string
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  action,
  onSubmit,
  isLoading
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<VerificationForm>()

  const selectedStatus = watch('status')

  return (
    <div className="space-y-6">
      {/* Action Details */}
      <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
        <h4 className="font-semibold text-neutral-900 mb-3">{action.title}</h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-600">User:</span>
            <p className="font-medium text-neutral-900">
              {action.first_name} {action.last_name}
            </p>
          </div>
          <div>
            <span className="text-neutral-600">Category:</span>
            <p className="font-medium text-neutral-900">{action.category_name}</p>
          </div>
          <div>
            <span className="text-neutral-600">Date:</span>
            <p className="font-medium text-neutral-900">
              {format(new Date(action.action_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <span className="text-neutral-600">Points:</span>
            <p className="font-medium text-neutral-900">{action.points_earned} pts</p>
          </div>
        </div>

        {action.description && (
          <div className="mt-3">
            <span className="text-neutral-600">Description:</span>
            <p className="text-neutral-900 mt-1">{action.description}</p>
          </div>
        )}

        {action.impact_value && action.impact_unit && (
          <div className="mt-3">
            <span className="text-neutral-600">Impact:</span>
            <p className="font-medium text-neutral-900">
              {action.impact_value} {action.impact_unit}
            </p>
          </div>
        )}
      </div>

      {/* Verification Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Verification Decision
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative">
              <input
                type="radio"
                value="verified"
                {...register('status', { required: 'Please select a verification status' })}
                className="sr-only"
              />
              <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedStatus === 'verified'
                  ? 'border-success-500 bg-success-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`h-6 w-6 ${
                    selectedStatus === 'verified' ? 'text-success-600' : 'text-neutral-400'
                  }`} />
                  <div>
                    <p className="font-medium text-neutral-900">Approve</p>
                    <p className="text-sm text-neutral-600">Action is valid and verified</p>
                  </div>
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                value="rejected"
                {...register('status', { required: 'Please select a verification status' })}
                className="sr-only"
              />
              <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedStatus === 'rejected'
                  ? 'border-error-500 bg-error-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <XCircle className={`h-6 w-6 ${
                    selectedStatus === 'rejected' ? 'text-error-600' : 'text-neutral-400'
                  }`} />
                  <div>
                    <p className="font-medium text-neutral-900">Reject</p>
                    <p className="text-sm text-neutral-600">Action needs clarification</p>
                  </div>
                </div>
              </div>
            </label>
          </div>
          {errors.status && (
            <p className="mt-2 text-sm text-error-600">{errors.status.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            rows={3}
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            placeholder="Add any notes or feedback for the user..."
            {...register('notes')}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsVerificationModalOpen(false)
              setSelectedAction(null)
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={selectedStatus === 'verified' ? 'primary' : 'danger'}
            loading={isLoading}
          >
            {selectedStatus === 'verified' ? 'Approve Action' : 'Reject Action'}
          </Button>
        </div>
      </form>
    </div>
  )
}