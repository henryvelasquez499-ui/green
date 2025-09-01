import React from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Calendar, Award, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface ActionListProps {
  actions: any[]
  categories: any[]
}

export const ActionList: React.FC<ActionListProps> = ({ actions, categories }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-error-600" />
      default:
        return <Clock className="h-4 w-4 text-neutral-400" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Award className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No actions yet</h3>
            <p className="text-neutral-600 mb-6">
              Start logging your sustainability actions to track your environmental impact!
            </p>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Log Your First Action
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {actions.map((action, index) => {
        const category = categories.find(c => c.id === action.categoryId)
        
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {action.title}
                      </h3>
                      <Badge 
                        variant={getStatusVariant(action.verificationStatus)}
                        size="sm"
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(action.verificationStatus)}
                          <span className="capitalize">{action.verificationStatus}</span>
                        </div>
                      </Badge>
                    </div>

                    {action.description && (
                      <p className="text-neutral-600 mb-3">{action.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(action.actionDate), 'MMM d, yyyy')}</span>
                      </div>
                      
                      {category && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4" />
                          <span>{category.name}</span>
                        </div>
                      )}

                      {action.impactValue && action.impactUnit && (
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">
                            {action.impactValue} {action.impactUnit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="h-4 w-4 text-accent-600" />
                      <span className="text-lg font-bold text-accent-600">
                        {action.pointsEarned} pts
                      </span>
                    </div>
                    
                    {category && (
                      <div 
                        className="w-3 h-3 rounded-full mx-auto"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                  </div>
                </div>

                {action.verificationNotes && (
                  <div className="mt-4 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                    <p className="text-sm text-neutral-600">
                      <strong>Admin Notes:</strong> {action.verificationNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}