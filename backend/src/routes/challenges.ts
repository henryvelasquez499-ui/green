import { Router } from 'express'
import { authMiddleware } from '../auth/middleware'
import { ChallengeService } from '../services/challenges'
import { DatabaseManager } from '../config/database'
import { CreateChallengeSchema } from '../validation/schemas'
import { securityHeaders } from '../middleware/security'

const router = Router()
const challengeService = new ChallengeService()
const db = DatabaseManager.getInstance()

// Get challenges
router.get('/', authMiddleware(), async (req: any, res) => {
  try {
    const status = req.query.status || 'active'
    const type = req.query.type

    let whereClause = "WHERE c.is_active = true"
    const params: any[] = []

    if (status === 'active') {
      whereClause += " AND c.start_date <= NOW() AND c.end_date > NOW()"
    } else if (status === 'upcoming') {
      whereClause += " AND c.start_date > NOW()"
    } else if (status === 'completed') {
      whereClause += " AND c.end_date <= NOW()"
    }

    if (type) {
      whereClause += ` AND c.challenge_type = $${params.length + 1}`
      params.push(type)
    }

    const challenges = await db.query(
      `SELECT 
         c.*,
         u.first_name as creator_name,
         COUNT(cp.user_id) as participant_count,
         CASE WHEN cp_user.user_id IS NOT NULL THEN true ELSE false END as user_joined
       FROM challenges c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
       LEFT JOIN challenge_participants cp_user ON c.id = cp_user.challenge_id AND cp_user.user_id = $${params.length + 1}
       ${whereClause}
       GROUP BY c.id, u.first_name, cp_user.user_id
       ORDER BY c.start_date DESC`,
      [...params, req.user.id]
    )

    const response = res.json({ challenges })
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch challenges' })
  }
})

// Join challenge
router.post('/:id/join', authMiddleware(), async (req: any, res) => {
  try {
    await challengeService.joinChallenge(req.user.id, req.params.id)

    const response = res.json({
      message: 'Successfully joined challenge',
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to join challenge' })
  }
})

// Leave challenge
router.delete('/:id/leave', authMiddleware(), async (req: any, res) => {
  try {
    const [participation] = await db.query(
      "SELECT id FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    )

    if (!participation) {
      return res.status(400).json({ error: 'Not participating in this challenge' })
    }

    await db.query("DELETE FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2", [
      req.params.id, 
      req.user.id
    ])

    const response = res.json({
      message: 'Successfully left challenge',
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to leave challenge' })
  }
})

export { router }