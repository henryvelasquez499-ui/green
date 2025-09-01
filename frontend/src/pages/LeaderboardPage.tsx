import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react'
import { gamificationApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuthStore } from '../stores/authStore'

export const LeaderboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all'>('monthly')
  const { user } = useAuthStore()

  const { data: leaderboardData, isLoading } = useQuery(
    ['leaderboard', timeframe],
    () => gamificationApi.getLeaderboard({ timeframe, limit: 50 })
  )

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-neutral-600">#{rank}</span>
    }
  }

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return 'warning'
      case 2:
        return 'default'
      case 3:
        return 'secondary'
      default:
        return 'default'
    }
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
          <h1 className="text-3xl font-bold text-neutral-900">Leaderboard</h1>
          <p className="mt-2 text-neutral-600">
            See how you rank among your colleagues in sustainability efforts
          </p>
        </div>
      </motion.div>

      {/* Timeframe Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-neutral-700">Time Period:</span>
              <div className="flex space-x-2">
                {(['weekly', 'monthly', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      timeframe === period
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                  <Trophy className="h-5 w-5 text-accent-600 mr-2" />
                  Global Rankings
                </h3>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboardData?.globalLeaderboard?.map((entry: any, index: number) => (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                          entry.userId === user?.id 
                            ? 'bg-primary-50 border border-primary-200' 
                            : 'bg-neutral-50 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(index + 1)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-neutral-900">
                              {entry.firstName} {entry.lastName}
                            </p>
                            {entry.userId === user?.id && (
                              <Badge variant="primary" size="sm">You</Badge>
                            )}
                          </div>
                          {entry.department && (
                            <p className="text-sm text-neutral-600">{entry.department}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-neutral-900">
                            {entry.totalPoints.toLocaleString()}
                          </p>
                          <p className="text-sm text-neutral-600">points</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Position */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Your Position</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">
                      #{leaderboardData?.userPosition?.rank || '-'}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {leaderboardData?.userPosition?.entry?.totalPoints?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-neutral-600">points this {timeframe.replace('ly', '')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Department Leaderboard */}
          {leaderboardData?.departmentLeaderboard && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-neutral-900">Department Rankings</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboardData.departmentLeaderboard.slice(0, 5).map((entry: any, index: number) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          entry.userId === user?.id 
                            ? 'bg-primary-50 border border-primary-200' 
                            : 'bg-neutral-50'
                        }`}
                      >
                        <span className="text-sm font-bold text-neutral-600 w-6">
                          #{entry.rank}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 text-sm">
                            {entry.firstName} {entry.lastName}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-neutral-900">
                          {entry.totalPoints.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Competition Stats</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Total Participants</span>
                    <span className="font-medium text-neutral-900">
                      {leaderboardData?.summary?.totalParticipants || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Your Rank</span>
                    <Badge variant={getRankBadgeVariant(leaderboardData?.summary?.userRank || 999)}>
                      #{leaderboardData?.summary?.userRank || '-'}
                    </Badge>
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