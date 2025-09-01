import { Router } from 'express'
import { authMiddleware } from '../auth/middleware'
import { ImpactCalculator } from '../services/impact'
import { DatabaseManager } from '../config/database'
import { TrackEventSchema } from '../validation/schemas'
import { securityHeaders } from '../middleware/security'

const router = Router()
const impactCalc = new ImpactCalculator()
const db = DatabaseManager.getInstance()

// Dashboard analytics
router.get('/dashboard', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id
    const timeframe = req.query.timeframe || '30'

    const [summary] = await db.query(
      `SELECT 
         COUNT(sa.id) as total_actions,
         SUM(sa.points_earned) as total_points,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as co2_saved,
         SUM(CASE WHEN sa.impact_unit = 'kwh' THEN sa.impact_value ELSE 0 END) as energy_saved,
         SUM(CASE WHEN sa.impact_unit = 'liters' THEN sa.impact_value ELSE 0 END) as water_saved,
         COUNT(DISTINCT DATE(sa.action_date)) as active_days
       FROM sustainability_actions sa
       WHERE sa.user_id = $1 
       AND sa.verification_status = 'verified'
       AND sa.created_at >= NOW() - INTERVAL '${timeframe} days'`,
      [userId],
    )

    const categoryBreakdown = await db.query(
      `SELECT 
         ac.name,
         ac.color,
         COUNT(sa.id) as action_count,
         SUM(sa.points_earned) as total_points,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as co2_impact
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1 
       AND sa.verification_status = 'verified'
       AND sa.created_at >= NOW() - INTERVAL '${timeframe} days'
       GROUP BY ac.id, ac.name, ac.color
       ORDER BY total_points DESC`,
      [userId],
    )

    const [streakInfo] = await db.query("SELECT current_streak, longest_streak FROM user_points WHERE user_id = $1", [
      userId,
    ])

    const response = res.json({
      timeframe: parseInt(timeframe),
      summary: {
        totalActions: parseInt(summary?.total_actions || '0'),
        totalPoints: parseInt(summary?.total_points || '0'),
        co2Saved: parseFloat(summary?.co2_saved || '0'),
        energySaved: parseFloat(summary?.energy_saved || '0'),
        waterSaved: parseFloat(summary?.water_saved || '0'),
        activeDays: parseInt(summary?.active_days || '0'),
        currentStreak: streakInfo?.current_streak || 0,
        longestStreak: streakInfo?.longest_streak || 0,
      },
      categoryBreakdown,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch dashboard analytics' })
  }
})

// Impact analytics
router.get('/impact', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id
    const startDate = req.query.startDate
    const endDate = req.query.endDate

    const dateRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    }

    const impactReport = await impactCalc.generateImpactReport(userId, dateRange)

    const monthlyTrends = await db.query(
      `SELECT 
         DATE_TRUNC('month', action_date) as month,
         COUNT(*) as actions_count,
         SUM(CASE WHEN impact_unit = 'kg_co2' THEN impact_value ELSE 0 END) as co2_saved,
         SUM(CASE WHEN impact_unit = 'kwh' THEN impact_value ELSE 0 END) as energy_saved,
         SUM(CASE WHEN impact_unit = 'liters' THEN impact_value ELSE 0 END) as water_saved
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= $2 AND action_date <= $3
       GROUP BY DATE_TRUNC('month', action_date)
       ORDER BY month`,
      [userId, dateRange.start, dateRange.end],
    )

    const totalCO2 = impactReport.co2Saved
    const equivalencies = {
      treesPlanted: Math.round(totalCO2 / 21),
      carMilesAvoided: Math.round(totalCO2 / 0.404),
      phoneCharges: Math.round((impactReport.energySaved * 1000) / 8.22),
      showerMinutes: Math.round(impactReport.waterSaved / 9.5),
    }

    const response = res.json({
      dateRange,
      impactReport,
      monthlyTrends,
      equivalencies,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch impact analytics' })
  }
})

// Trends analytics
router.get('/trends', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id

    const weeklyTrends = await db.query(
      `SELECT 
         DATE_TRUNC('week', action_date) as week,
         COUNT(*) as actions_count,
         SUM(points_earned) as points_earned,
         SUM(CASE WHEN impact_unit = 'kg_co2' THEN impact_value ELSE 0 END) as co2_saved
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= NOW() - INTERVAL '12 weeks'
       GROUP BY DATE_TRUNC('week', action_date)
       ORDER BY week`,
      [userId],
    )

    const response = res.json({
      weeklyTrends,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch trend analytics' })
  }
})

// Track events
router.post('/track', authMiddleware(), async (req: any, res) => {
  try {
    const validatedData = TrackEventSchema.parse(req.body)
    const userId = req.user.id

    const userAgent = req.headers['user-agent'] || ''
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'

    await db.query(
      "INSERT INTO user_analytics (user_id, event_type, event_data, session_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        userId,
        validatedData.eventType,
        JSON.stringify(validatedData.eventData || {}),
        validatedData.sessionId,
        ipAddress,
        userAgent,
      ],
    )

    const response = res.json({
      message: 'Event tracked successfully',
      eventType: validatedData.eventType,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to track event' })
  }
})

export { router }