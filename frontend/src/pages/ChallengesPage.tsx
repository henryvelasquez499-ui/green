import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Target, Users, Calendar, Award, Plus } from 'lucide-react'
import { challengesApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ChallengeCard } from '../components/challenges/ChallengeCard'
import { ChallengeFilters } from '../components/challenges/ChallengeFilters'
import toast from 'react-hot-toast'

export const ChallengesPage: React.FC = () => {
  const [filters, setFilters] = useState({
    status: 'active',
    type: ''
  })
  const queryClient = useQueryClient()

  const { data: challengesData, isLoading } = useQuery(
    ['challenges', filters],
    () => challengesApi.getChallenges(filters)
  )

  const joinChallengeMutation = useMutation(
    (challengeId: string) => challengesApi.joinChallenge(challengeId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('challenges')
        toast.success('Successfully joined challenge!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to join challenge')
      }
    }
  )

  const leaveChallengeM utation = useMutation(
    (challengeId: string) => challengesApi.leaveChallenge(challengeId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('challenges')
        toast.success('Left challenge successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to leave challenge')
      }
    }
  )

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
          <h1 className="text-3xl font-bold text-neutral-900">Challenges</h1>
          <p className="mt-2 text-neutral-600">
            Join sustainability challenges and compete with your colleagues
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ChallengeFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </motion.div>

      {/* Challenges Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
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
                <ChallengeCard
                  challenge={challenge}
                  onJoin={() => joinChallengeMutation.mutate(challenge.id)}
                  onLeave={() => leaveChallengeM utation.mutate(challenge.id)}
                  isJoining={joinChallengeMutation.isLoading}
                  isLeaving={leaveChallengeM utation.isLoading}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No challenges found</h3>
              <p className="text-neutral-600">
                {filters.status === 'active' 
                  ? 'No active challenges at the moment. Check back soon!'
                  : 'Try adjusting your filters to see more challenges.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}