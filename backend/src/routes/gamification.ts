import { Router } from 'express'
import { authMiddleware } from '../auth/middleware'
import { BadgeService } from '../services/badges'
import { PointsCalculator } from '../services/points'
import { UserRepository } from '../repositories/UserRepository'
import { DatabaseManager } from '../config/database'
import { securityHeaders } from '../middleware/security'

const router = Router()
const badgeService = new BadgeService()
const pointsCalc = new PointsCalculator()
const userRepo = new UserRepository()
const db = DatabaseManager.getInstance()

// Get user points
router.get('/points', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id
    const userStats = await userRepo.getUserStats(userId)

    const recentTransactions = await db.query(
      `SELECT points, transaction_type, description, created_at
       FROM point_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId],
    )

    const categoryBreakdown = await db.query(
      `SELECT ac.name, ac.color, SUM(sa.points_earned) as total_points, COUNT(*) as action_count
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1 AND sa.verification_status = 'verified'
       GROUP BY ac.id, ac.name, ac.color
       ORDER BY total_points DESC`,
      [userId],
    )

    const response = res.json({
      summary: userStats,
      recentTransactions,
      categoryBreakdown,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch points data' })
  }
})

// Get user badges
router.get('/badges', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id

    const earnedBadges = await badgeService.getUserBadges(userId)

    const allBadges = await db.query(
      `SELECT b.*, 
        CASE WHEN ub.badge_id IS NOT NULL THEN true ELSE false END as earned,
        ub.earned_at
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
       WHERE b.is_active = true
       ORDER BY earned DESC, b.rarity, b.name`,
      [userId],
    )

    const response = res.json({
      earnedBadges,
      allBadges,
      summary: {
        totalEarned: earnedBadges.length,
        totalAvailable: allBadges.length,
        completionPercentage: Math.round((earnedBadges.length / allBadges.length) * 100),
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch badges' })
  }
})

// Claim badge
router.post('/badges/claim', authMiddleware(), async (req: any, res) => {
  try {
    const { badgeId } = req.body
    const userId = req.user.id

    if (!badgeId) {
      return res.status(400).json({ error: 'Badge ID required' })
    }

    const eligibleBadges = await badgeService.checkBadgeEligibility(userId)
    const isEligible = eligibleBadges.some((badge) => badge.id === badgeId)

    if (!isEligible) {
      return res.status(400).json({ error: 'Not eligible for this badge' })
    }

    await badgeService.awardBadge(userId, badgeId)

    const response = res.json({
      message: 'Badge claimed successfully!',
      badgeId,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to claim badge' })
  }
})

// Get leaderboard
router.get('/leaderboard', authMiddleware(), async (req: any, res) => {
  try {
    const timeframe = req.query.timeframe as 'weekly' | 'monthly' | 'all' || 'all'
    const limit = parseInt(req.query.limit as string) || 50
    const userId = req.user.id

    const leaderboard = await pointsCalc.calculateLeaderboard(timeframe)
    const topUsers = leaderboard.slice(0, limit)

    const userPosition = leaderboard.findIndex((entry) => entry.userId === userId)
    const userEntry = userPosition >= 0 ? leaderboard[userPosition] : null

    const response = res.json({
      timeframe,
      globalLeaderboard: topUsers,
      userPosition: {
        rank: userPosition + 1,
        entry: userEntry,
      },
      summary: {
        totalParticipants: leaderboard.length,
        userRank: userPosition + 1,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' })
  }
})

// Get user progress
router.get('/progress', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id
    const userStats = await userRepo.getUserStats(userId)

    const progressData = await db.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as actions_count,
         SUM(points_earned) as points_earned,
         SUM(CASE WHEN impact_unit = 'kg_co2' THEN impact_value ELSE 0 END) as co2_saved
       FROM sustainability_actions 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId],
    )

    const categoryProgress = await db.query(
      `SELECT 
         ac.name,
         ac.color,
         COUNT(*) as action_count,
         SUM(sa.points_earned) as total_points,
         AVG(sa.points_earned) as avg_points
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1 AND sa.verification_status = 'verified'
       GROUP BY ac.id, ac.name, ac.color
       ORDER BY total_points DESC`,
      [userId],
    )

    const response = res.json({
      userStats,
      progressData,
      categoryProgress,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch progress data' })
  }
})

// Get achievements
router.get('/achievements', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id

    const recentAchievements = await db.query(
      `SELECT b.name, b.description, b.icon_url, b.rarity, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1 AND ub.earned_at >= NOW() - INTERVAL '30 days'
       ORDER BY ub.earned_at DESC`,
      [userId],
    )

    const claimableBadges = await badgeService.checkBadgeEligibility(userId)

    const response = res.json({
      recentAchievements,
      claimableBadges,
      summary: {
        recentCount: recentAchievements.length,
        claimableCount: claimableBadges.length,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch achievements' })
  }
})

export { router }