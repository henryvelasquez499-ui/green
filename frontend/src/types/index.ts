export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'employee' | 'admin' | 'sustainability_manager'
  department?: string
  avatarUrl?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface SustainabilityAction {
  id: string
  userId: string
  categoryId: string
  title: string
  description?: string
  impactValue?: number
  impactUnit?: string
  pointsEarned: number
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationNotes?: string
  verifiedBy?: string
  verifiedAt?: string
  actionDate: string
  createdAt: string
  updatedAt: string
}

export interface ActionCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  pointsMultiplier: number
  isActive: boolean
  createdAt: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  challengeType: 'individual' | 'team' | 'department' | 'company_wide'
  targetMetric: 'actions_count' | 'points_total' | 'impact_value'
  targetValue: number
  startDate: string
  endDate: string
  rewardPoints: number
  rewardDescription?: string
  isActive: boolean
  createdBy: string
  participantCount: number
  userJoined: boolean
  userProgress?: number
  userCompleted?: boolean
}

export interface Team {
  id: string
  name: string
  description: string
  department?: string
  teamLeader: string
  leaderName: string
  maxMembers: number
  memberCount: number
  teamPoints?: number
  monthlyPoints?: number
  userJoined: boolean
  userRole?: 'member' | 'leader' | 'co_leader'
  isActive: boolean
  createdAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  iconUrl: string
  criteriaType: 'action_count' | 'points_total' | 'streak_days' | 'category_master'
  criteriaValue: number
  categoryId?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isActive: boolean
  earned?: boolean
  earnedAt?: string
  progress?: number
}

export interface UserStats {
  totalPoints: number
  monthlyPoints: number
  weeklyPoints: number
  currentStreak: number
  longestStreak: number
  totalActions: number
  totalBadges: number
}

export interface LeaderboardEntry {
  userId: string
  firstName: string
  lastName: string
  department?: string
  totalPoints: number
  rank: number
}

export interface ImpactReport {
  co2Saved: number
  energySaved: number
  waterSaved: number
  totalActions: number
  period: string
}