import React from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Calendar, Users, Target, Award, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface ChallengeCardProps {
  challenge: any
  onJoin: () => void
  onLeave: () => void
  isJoining: boolean
  isLeaving: boolean
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onJoin,
  onLeave,
  isJoining,
  isLeaving
}) => {
  const isActive = new Date(challenge.startDate) <= new Date() && new Date(challenge.endDate) > new Date()
  const isUpcoming = new Date(challenge.startDate) > new Date()
  const isCompleted = new Date(challenge.endDate) <= new Date()

  const getStatusBadge = () => {
    if (isUpcoming) return <Badge variant="secondary">Upcoming</Badge>
    if (isCompleted) return <Badge variant="default">Completed</Badge>
    if (isActive) return <Badge variant="success">Active</Badge>
    return null
  }

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'individual':
        return 'text-primary-600 bg-primary-100'
      case 'team':
        return 'text-secondary-600 bg-secondary-100'
      case 'department':
        return 'text-accent-600 bg-accent-100'
      case 'company_wide':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-neutral-600 bg-neutral-100'
    }
  }

  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {challenge.title}
            </h3>
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
              <Badge 
                variant="default" 
                size="sm"
                className={getChallengeTypeColor(challenge.challengeType)}
              >
                {challenge.challengeType.replace('_', ' ')}
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
              <span>Target: {challenge.targetValue} {challenge.targetMetric.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-neutral-600">
              <Users className="h-4 w-4" />
              <span>{challenge.participantCount} participants</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-600">
              <Award className="h-4 w-4" />
              <span>{challenge.rewardPoints} points</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}
            </span>
          </div>

          {challenge.userJoined && challenge.userProgress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600">Your Progress</span>
                <span className="font-medium text-neutral-900">
                  {challenge.userProgress} / {challenge.targetValue}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((challenge.userProgress / challenge.targetValue) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                />
              </div>
              {challenge.userCompleted && (
                <div className="flex items-center space-x-2 mt-2 text-success-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed!</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          {challenge.userJoined ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              loading={isLeaving}
              className="flex-1"
            >
              Leave Challenge
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onJoin}
              loading={isJoining}
              disabled={!isActive}
              className="flex-1"
            >
              Join Challenge
            </Button>
          )}
          <Button variant="ghost" size="sm">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}