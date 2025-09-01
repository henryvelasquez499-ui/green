import { Router } from 'express'
import { requireAdmin } from '../auth/middleware'
import { ActionRepository } from '../repositories/ActionRepository'
import { UserRepository } from '../repositories/UserRepository'
import { DatabaseManager } from '../config/database'
import { 
  CreateUserSchema, 
  UpdateUserSchema, 
  VerifyActionSchema, 
  BulkVerifyActionsSchema,
  CreateChallengeSchema,
  SystemSettingsSchema 
} from '../validation/schemas'
import { securityHeaders } from '../middleware/security'

const router = Router()
const actionRepo = new ActionRepository()
const userRepo = new UserRepository()
const db = DatabaseManager.getInstance()

// Users management
router.get('/users', requireAdmin, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100
    const offset = parseInt(req.query.offset as string) || 0
    const role = req.query.role
    const status = req.query.status
    const search = req.query.search

    let users = await userRepo.getAllUsers(limit, offset)

    // Apply filters
    if (role) {
      users = users.filter((user) => user.role === role)
    }
    if (status === 'active') {
      users = users.filter((user) => user.isActive)
    } else if (status === 'inactive') {
      users = users.filter((user) => !user.isActive)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower),
      )
    }

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await userRepo.getUserStats(user.id)
        return { ...user, stats }
      }),
    )

    const response = res.json({
      users: usersWithStats,
      pagination: {
        limit,
        offset,
        total: users.length,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch users' })
  }
})

// Actions management
router.get('/actions', requireAdmin, async (req: any, res) => {
  try {
    const status = req.query.status || 'all'
    const limit = parseInt(req.query.limit as string) || 100
    const offset = parseInt(req.query.offset as string) || 0

    let whereClause = ""
    const params: any[] = []

    if (status === 'pending') {
      whereClause = "WHERE sa.verification_status = 'pending'"
    } else if (status === 'verified') {
      whereClause = "WHERE sa.verification_status = 'verified'"
    } else if (status === 'rejected') {
      whereClause = "WHERE sa.verification_status = 'rejected'"
    }

    const actions = await db.query(
      `SELECT 
         sa.*,
         u.first_name,
         u.last_name,
         u.email,
         ac.name as category_name,
         ac.color as category_color
       FROM sustainability_actions sa
       JOIN users u ON sa.user_id = u.id
       JOIN action_categories ac ON sa.category_id = ac.id
       ${whereClause}
       ORDER BY sa.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )

    const response = res.json({
      actions,
      pagination: {
        limit,
        offset,
        hasMore: actions.length === limit,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch actions' })
  }
})

// Verify action
router.put('/actions/:id/verify', requireAdmin, async (req: any, res) => {
  try {
    const validatedData = VerifyActionSchema.parse(req.body)
    const adminId = req.user.id

    const updatedAction = await actionRepo.update(req.params.id, {
      verificationStatus: validatedData.status,
      verificationNotes: validatedData.notes,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    })

    const response = res.json({
      message: `Action ${validatedData.status} successfully`,
      action: updatedAction,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to verify action' })
  }
})

// Get challenges
router.get('/challenges', requireAdmin, async (req: any, res) => {
  try {
    const challenges = await db.query(
      `SELECT 
         c.*,
         u.first_name as creator_name,
         COUNT(cp.user_id) as participant_count
       FROM challenges c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
       GROUP BY c.id, u.first_name
       ORDER BY c.created_at DESC`,
      [],
    )

    const response = res.json({ challenges })
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch challenges' })
  }
})

// ESG Reports
router.get('/reports/esg', requireAdmin, async (req: any, res) => {
  try {
    const startDate = req.query.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = req.query.endDate || new Date().toISOString()

    // Company-wide metrics
    const [companyMetrics] = await db.query(
      `SELECT 
         COUNT(DISTINCT u.id) as total_active_users,
         COUNT(sa.id) as total_actions,
         SUM(sa.points_earned) as total_points,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as total_co2_saved,
         SUM(CASE WHEN sa.impact_unit = 'kwh' THEN sa.impact_value ELSE 0 END) as total_energy_saved,
         SUM(CASE WHEN sa.impact_unit = 'liters' THEN sa.impact_value ELSE 0 END) as total_water_saved
       FROM users u
       LEFT JOIN sustainability_actions sa ON u.id = sa.user_id 
         AND sa.verification_status = 'verified'
         AND sa.action_date >= $1 AND sa.action_date <= $2
       WHERE u.is_active = true`,
      [startDate, endDate],
    )

    // Department breakdown
    const departmentBreakdown = await db.query(
      `SELECT 
         u.department,
         COUNT(DISTINCT u.id) as user_count,
         COUNT(sa.id) as action_count,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as co2_saved,
         AVG(up.total_points) as avg_points_per_user
       FROM users u
       LEFT JOIN sustainability_actions sa ON u.id = sa.user_id 
         AND sa.verification_status = 'verified'
         AND sa.action_date >= $1 AND sa.action_date <= $2
       LEFT JOIN user_points up ON u.id = up.user_id
       WHERE u.is_active = true AND u.department IS NOT NULL
       GROUP BY u.department
       ORDER BY co2_saved DESC`,
      [startDate, endDate],
    )

    const response = res.json({
      reportPeriod: { startDate, endDate },
      companyMetrics: {
        totalActiveUsers: parseInt(companyMetrics?.total_active_users || '0'),
        totalActions: parseInt(companyMetrics?.total_actions || '0'),
        totalPoints: parseInt(companyMetrics?.total_points || '0'),
        totalCO2Saved: parseFloat(companyMetrics?.total_co2_saved || '0'),
        totalEnergySaved: parseFloat(companyMetrics?.total_energy_saved || '0'),
        totalWaterSaved: parseFloat(companyMetrics?.total_water_saved || '0'),
      },
      departmentBreakdown,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate ESG report' })
  }
})

// Settings management
router.get('/settings', requireAdmin, async (req: any, res) => {
  try {
    const settings = await db.query("SELECT * FROM system_settings ORDER BY key", [])

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        dataType: setting.data_type,
        isPublic: setting.is_public,
        updatedAt: setting.updated_at,
      }
      return acc
    }, {})

    const response = res.json({ settings: settingsMap })
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch settings' })
  }
})

router.put('/settings', requireAdmin, async (req: any, res) => {
  try {
    const validatedData = SystemSettingsSchema.parse(req.body)
    const adminId = req.user.id

    // Update multiple settings
    for (const [key, value] of Object.entries(validatedData.settings)) {
      await db.query(
        `INSERT INTO system_settings (key, value, updated_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (key)
         DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
        [key, value, adminId],
      )
    }

    const response = res.json({
      message: 'Settings updated successfully',
      updatedCount: Object.keys(validatedData.settings).length,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update settings' })
  }
})

export { router }