import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Target, Plus, Calendar, Users, Award } from 'lucide-react'
import { format } from 'date-fns'
import { adminApi } from '../../services/api'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export const AdminChallengesPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: challengesData, isLoading } = useQuery(
    'admin-challenges',
    () => adminApi.getAdminChallenges()
  )

  const createChallengeMutation = useMutation(
    (data: any) => adminApi.createChallenge(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-challenges')
        setIsCreateModalOpen(false)
        toast.success('Challenge created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create challenge')
      }
    }
  )

  const getStatusBadge = (challenge: any) => {
    const now = new Date()
    const startDate = new Date(challenge.start_date)
    const endDate = new Date(challenge.end_date)

    if (startDate > now) return <Badge variant="secondary">Upcoming</Badge>
    if (endDate <= now) return <Badge variant="default">Completed</Badge>
    if (startDate <= now && endDate > now) return <Badge variant="success">Active</Badge>
    return null
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
          <h1 className="text-3xl font-bold text-neutral-900">Challenge Management</h1>
          <p className="mt-2 text-neutral-600">
            Create and manage sustainability challenges for your organization
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Challenge
        </Button>
      </motion.div>

      {/* Challenges List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : challengesData?.challenges?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challengesData.challenges.map((challenge: any, index: number) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card hover>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                          {challenge.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(challenge)}
                          <Badge variant="default" size="sm">
                            {challenge.challenge_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-neutral-600 mb-4 line-clamp-2">
                      {challenge.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-neutral-600">
                          <Target className="h-4 w-4" />
                          <span>Target: {challenge.target_value} {challenge.target_metric.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-neutral-600">
                          <Users className="h-4 w-4" />
                          <span>{challenge.participant_count} participants</span>
                        </div>
                        <div className="flex items-center space-x-2 text-neutral-600">
                          <Award className="h-4 w-4" />
                          <span>{challenge.reward_points} points</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-neutral-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No challenges yet</h3>
              <p className="text-neutral-600 mb-6">
                Create the first challenge to engage your team!
              </p>
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}