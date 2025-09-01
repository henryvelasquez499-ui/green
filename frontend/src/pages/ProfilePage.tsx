import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { User, Award, TrendingUp, Calendar, Edit3, Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../stores/authStore'
import { gamificationApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const { data: progressData, isLoading: progressLoading } = useQuery(
    'user-progress',
    () => gamificationApi.getProgress()
  )

  const { data: badgesData, isLoading: badgesLoading } = useQuery(
    'user-badges',
    () => gamificationApi.getBadges()
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      department: user?.department || ''
    }
  })

  const updateProfileMutation = useMutation(
    (data: any) => updateProfile(data),
    {
      onSuccess: () => {
        setIsEditing(false)
        toast.success('Profile updated successfully!')
        queryClient.invalidateQueries('user-progress')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update profile')
      }
    }
  )

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data)
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
        <p className="mt-2 text-neutral-600">
          Manage your account and view your sustainability achievements
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                    <User className="h-5 w-5 text-primary-600 mr-2" />
                    Personal Information
                  </h3>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit(onSubmit)}
                        loading={updateProfileMutation.isLoading}
                        className="flex items-center"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        error={errors.firstName?.message}
                        {...register('firstName', {
                          required: 'First name is required'
                        })}
                      />
                      <Input
                        label="Last Name"
                        error={errors.lastName?.message}
                        {...register('lastName', {
                          required: 'Last name is required'
                        })}
                      />
                    </div>
                    <Input
                      label="Department"
                      {...register('department')}
                    />
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-neutral-900">
                          {user?.firstName} {user?.lastName}
                        </h4>
                        <p className="text-neutral-600">{user?.email}</p>
                        {user?.department && (
                          <Badge variant="secondary" size="sm" className="mt-1">
                            {user.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Badges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                  <Award className="h-5 w-5 text-accent-600 mr-2" />
                  Recent Achievements
                </h3>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <LoadingSpinner />
                  </div>
                ) : badgesData?.earnedBadges?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {badgesData.earnedBadges.slice(0, 6).map((badge: any, index: number) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="text-center p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-medium text-neutral-900 text-sm">{badge.name}</p>
                        <Badge variant="default" size="sm" className="mt-1">
                          {badge.rarity}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">No badges earned yet</p>
                    <p className="text-sm text-neutral-400">Complete actions to earn achievements!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                  <TrendingUp className="h-5 w-5 text-secondary-600 mr-2" />
                  Your Stats
                </h3>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Total Points</span>
                      <span className="text-lg font-bold text-neutral-900">
                        {progressData?.userStats?.totalPoints?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Total Actions</span>
                      <span className="text-lg font-bold text-neutral-900">
                        {progressData?.userStats?.totalActions || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Current Streak</span>
                      <span className="text-lg font-bold text-neutral-900">
                        {progressData?.userStats?.currentStreak || 0} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Badges Earned</span>
                      <span className="text-lg font-bold text-neutral-900">
                        {progressData?.userStats?.totalBadges || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Account Information</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Role</span>
                    <Badge variant="primary" size="sm">
                      {user?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Member Since</span>
                    <span className="text-neutral-900">
                      {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}