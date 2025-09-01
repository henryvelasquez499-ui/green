import React from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Calendar, FileText, Target, Zap } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface ActionFormProps {
  categories: any[]
  onSubmit: (data: any) => void
  isLoading: boolean
  initialData?: any
}

interface ActionFormData {
  title: string
  description?: string
  categoryId: string
  impactValue?: number
  impactUnit?: string
  actionDate: string
}

export const ActionForm: React.FC<ActionFormProps> = ({
  categories,
  onSubmit,
  isLoading,
  initialData
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ActionFormData>({
    defaultValues: initialData || {
      actionDate: new Date().toISOString().split('T')[0]
    }
  })

  const selectedCategory = watch('categoryId')
  const category = categories.find(c => c.id === selectedCategory)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Input
          label="Action Title"
          type="text"
          icon={<Target className="h-4 w-4" />}
          placeholder="e.g., Biked to work instead of driving"
          error={errors.title?.message}
          {...register('title', {
            required: 'Title is required',
            minLength: {
              value: 3,
              message: 'Title must be at least 3 characters'
            }
          })}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Category
          </label>
          <select
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            {...register('categoryId', { required: 'Category is required' })}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-error-600">{errors.categoryId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Description (optional)
          </label>
          <textarea
            rows={3}
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            placeholder="Describe your action and its impact..."
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Impact Value (optional)"
            type="number"
            step="0.01"
            icon={<Zap className="h-4 w-4" />}
            placeholder="e.g., 5.2"
            error={errors.impactValue?.message}
            {...register('impactValue', {
              min: {
                value: 0,
                message: 'Impact value must be positive'
              }
            })}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Impact Unit
            </label>
            <select
              className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              {...register('impactUnit')}
            >
              <option value="">Select unit</option>
              <option value="kg_co2">kg CO₂</option>
              <option value="kwh">kWh</option>
              <option value="liters">Liters</option>
              <option value="km">Kilometers</option>
            </select>
          </div>
        </div>

        <Input
          label="Action Date"
          type="date"
          icon={<Calendar className="h-4 w-4" />}
          error={errors.actionDate?.message}
          {...register('actionDate', {
            required: 'Action date is required'
          })}
        />
      </div>

      {category && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-lg bg-neutral-50 border border-neutral-200"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="font-medium text-neutral-900">{category.name}</span>
            <Badge variant="primary" size="sm">
              {category.points_multiplier}x points
            </Badge>
          </div>
          <p className="text-sm text-neutral-600">{category.description}</p>
        </motion.div>
      )}

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
          {initialData ? 'Update Action' : 'Log Action'}
        </Button>
      </div>
    </form>
  )
}