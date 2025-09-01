import { Router } from 'express'
import { authMiddleware } from '../auth/middleware'
import { ActionRepository } from '../repositories/ActionRepository'
import { PointsCalculator } from '../services/points'
import { BadgeService } from '../services/badges'
import { CreateActionSchema, UpdateActionSchema, BulkCreateActionsSchema } from '../validation/schemas'
import { securityHeaders } from '../middleware/security'
import { DatabaseManager } from '../config/database'

const router = Router()
const actionRepo = new ActionRepository()
const pointsCalc = new PointsCalculator()
const badgeService = new BadgeService()
const db = DatabaseManager.getInstance()

// Get user actions
router.get('/', authMiddleware(), async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0
    
    const actions = await actionRepo.findByUserId(req.user.id, limit, offset)

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

// Create action
router.post('/', authMiddleware(), async (req: any, res) => {
  try {
    const validatedData = CreateActionSchema.parse(req.body)

    const action = await actionRepo.create({
      userId: req.user.id,
      categoryId: validatedData.categoryId,
      title: validatedData.title,
      description: validatedData.description,
      impactValue: validatedData.impactValue,
      impactUnit: validatedData.impactUnit,
      actionDate: new Date(validatedData.actionDate),
    })

    const points = await pointsCalc.calculateActionPoints(action)
    await pointsCalc.updateUserPoints(req.user.id, points, action.id)
    await actionRepo.update(action.id, { pointsEarned: points })
    await badgeService.processAutomaticBadgeAwards(req.user.id)

    const response = res.json({
      message: 'Action logged successfully',
      action: { ...action, pointsEarned: points },
      pointsEarned: points,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to create action' })
  }
})

// Get categories
router.get('/categories', authMiddleware(), async (req: any, res) => {
  try {
    const categories = await db.query(
      `SELECT id, name, description, icon, color, points_multiplier
       FROM action_categories 
       WHERE is_active = true
       ORDER BY name`,
      []
    )

    const response = res.json({ categories })
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch categories' })
  }
})

// Export actions
router.get('/export', authMiddleware(), async (req: any, res) => {
  try {
    const format = req.query.format || 'json'
    const startDate = req.query.startDate
    const endDate = req.query.endDate

    const actions = await actionRepo.findByUserId(req.user.id, 1000, 0)

    let filteredActions = actions
    if (startDate || endDate) {
      filteredActions = actions.filter((action) => {
        const actionDate = new Date(action.actionDate)
        if (startDate && actionDate < new Date(startDate)) return false
        if (endDate && actionDate > new Date(endDate)) return false
        return true
      })
    }

    if (format === 'csv') {
      const csvHeaders = "Date,Title,Category,Impact Value,Impact Unit,Points Earned,Status\n"
      const csvRows = filteredActions
        .map(
          (action) =>
            `${action.actionDate},${action.title},"${action.categoryId}",${action.impactValue || ""},${action.impactUnit || ""},${action.pointsEarned},${action.verificationStatus}`,
        )
        .join("\n")

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=sustainability-actions.csv')
      return res.send(csvHeaders + csvRows)
    }

    const response = res.json({
      actions: filteredActions,
      summary: {
        totalActions: filteredActions.length,
        totalPoints: filteredActions.reduce((sum, action) => sum + action.pointsEarned, 0),
        totalImpact: filteredActions.reduce((sum, action) => sum + (action.impactValue || 0), 0),
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to export actions' })
  }
})

export { router }