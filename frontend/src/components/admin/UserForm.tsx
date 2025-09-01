import React from 'react'
import { useForm } from 'react-hook-form'
import { User, Mail, Lock, Building } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface UserFormProps {
  onSubmit: (data: any) => void
  isLoading: boolean
  initialData?: any
}

interface UserFormData {
  email: string
  password?: string
  firstName: string
  lastName: string
  department?: string
  role: string
}

export const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  isLoading,
  initialData
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UserFormData>({
    defaultValues: initialData || {
      role: 'employee'
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          icon={<User className="h-4 w-4" />}
          error={errors.firstName?.message}
          {...register('firstName', {
            required: 'First name is required'
          })}
        />

        <Input
          label="Last Name"
          type="text"
          icon={<User className="h-4 w-4" />}
          error={errors.lastName?.message}
          {...register('lastName', {
            required: 'Last name is required'
          })}
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })}
      />

      {!initialData && (
        <Input
          label="Password"
          type="password"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
        />
      )}

      <Input
        label="Department"
        type="text"
        icon={<Building className="h-4 w-4" />}
        error={errors.department?.message}
        {...register('department')}
      />

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Role
        </label>
        <select
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          {...register('role', { required: 'Role is required' })}
        >
          <option value="employee">Employee</option>
          <option value="sustainability_manager">Sustainability Manager</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCreateModalOpen(false)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
        >
          {initialData ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  )
}