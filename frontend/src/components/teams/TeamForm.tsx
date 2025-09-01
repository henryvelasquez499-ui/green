import React from 'react'
import { useForm } from 'react-hook-form'
import { Users, FileText, Building } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface TeamFormProps {
  onSubmit: (data: any) => void
  isLoading: boolean
  initialData?: any
}

interface TeamFormData {
  name: string
  description: string
  department?: string
  maxMembers: number
}

export const TeamForm: React.FC<TeamFormProps> = ({
  onSubmit,
  isLoading,
  initialData
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TeamFormData>({
    defaultValues: initialData || {
      maxMembers: 10
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Team Name"
        type="text"
        icon={<Users className="h-4 w-4" />}
        placeholder="e.g., Green Warriors"
        error={errors.name?.message}
        {...register('name', {
          required: 'Team name is required',
          minLength: {
            value: 3,
            message: 'Team name must be at least 3 characters'
          }
        })}
      />

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          placeholder="Describe your team's mission and goals..."
          {...register('description', {
            required: 'Description is required'
          })}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
        )}
      </div>

      <Input
        label="Department (optional)"
        type="text"
        icon={<Building className="h-4 w-4" />}
        placeholder="e.g., Engineering"
        error={errors.department?.message}
        {...register('department')}
      />

      <Input
        label="Maximum Members"
        type="number"
        min="2"
        max="50"
        error={errors.maxMembers?.message}
        {...register('maxMembers', {
          required: 'Maximum members is required',
          min: {
            value: 2,
            message: 'Team must have at least 2 members'
          },
          max: {
            value: 50,
            message: 'Team cannot have more than 50 members'
          }
        })}
      />

      <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => {}}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
        >
          Create Team
        </Button>
      </div>
    </form>
  )
}