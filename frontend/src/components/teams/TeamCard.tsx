import React from 'react'
import { motion } from 'framer-motion'
import { Users, Crown, Award, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface TeamCardProps {
  team: any
  onJoin: () => void
  isJoining: boolean
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onJoin,
  isJoining
}) => {
  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {team.name}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="primary" size="sm">
                {team.memberCount}/{team.maxMembers} members
              </Badge>
              {team.department && (
                <Badge variant="secondary" size="sm">
                  {team.department}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {team.description && (
          <p className="text-neutral-600 mb-4 line-clamp-2">
            {team.description}
          </p>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-neutral-600">
              <Crown className="h-4 w-4" />
              <span>Led by {team.leaderName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-neutral-600">
              <Award className="h-4 w-4" />
              <span>{team.teamPoints || 0} total points</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-600">
              <TrendingUp className="h-4 w-4" />
              <span>{team.monthlyPoints || 0} this month</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          {team.userJoined ? (
            <Badge variant="success" className="flex-1 justify-center py-2">
              <Users className="h-4 w-4 mr-1" />
              Member
            </Badge>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onJoin}
              loading={isJoining}
              disabled={team.memberCount >= team.maxMembers}
              className="flex-1"
            >
              {team.memberCount >= team.maxMembers ? 'Team Full' : 'Join Team'}
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