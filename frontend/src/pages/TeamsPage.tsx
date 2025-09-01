import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Users, Plus, Search } from 'lucide-react'
import { teamsApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { TeamCard } from '../components/teams/TeamCard'
import { TeamForm } from '../components/teams/TeamForm'
import toast from 'react-hot-toast'

export const TeamsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: teamsData, isLoading } = useQuery(
    'teams',
    () => teamsApi.getTeams()
  )

  const createTeamMutation = useMutation(
    (data: any) => teamsApi.createTeam(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams')
        setIsCreateModalOpen(false)
        toast.success('Team created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create team')
      }
    }
  )

  const joinTeamMutation = useMutation(
    (teamId: string) => teamsApi.joinTeam(teamId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams')
        toast.success('Successfully joined team!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to join team')
      }
    }
  )

  const filteredTeams = teamsData?.teams?.filter((team: any) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
          <h1 className="text-3xl font-bold text-neutral-900">Teams</h1>
          <p className="mt-2 text-neutral-600">
            Join or create teams to collaborate on sustainability goals
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 h-full w-5 text-neutral-400 pl-3" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Teams Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team: any, index: number) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <TeamCard
                  team={team}
                  onJoin={() => joinTeamMutation.mutate(team.id)}
                  isJoining={joinTeamMutation.isLoading}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {searchTerm ? 'No teams found' : 'No teams yet'}
              </h3>
              <p className="text-neutral-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create the first team to start collaborating!'
                }
              </p>
              {!searchTerm && (
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Create Team Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Team"
        size="lg"
      >
        <TeamForm
          onSubmit={(data) => createTeamMutation.mutate(data)}
          isLoading={createTeamMutation.isLoading}
        />
      </Modal>
    </div>
  )
}