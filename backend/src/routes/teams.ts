import { Router } from 'express'
import { authMiddleware } from '../auth/middleware'
import { DatabaseManager } from '../config/database'
import { CreateTeamSchema } from '../validation/schemas'
import { securityHeaders } from '../middleware/security'

const router = Router()
const db = DatabaseManager.getInstance()

// Get teams
router.get('/', authMiddleware(), async (req: any, res) => {
  try {
    const department = req.query.department
    const userId = req.user.id

    let whereClause = "WHERE t.is_active = true"
    const params: any[] = []

    if (department) {
      whereClause += ` AND t.department = $${params.length + 1}`
      params.push(department)
    }

    const teams = await db.query(
      `SELECT 
         t.*,
         u.first_name as leader_name,
         COUNT(tm.user_id) as member_count,
         CASE WHEN tm_user.user_id IS NOT NULL THEN true ELSE false END as user_joined,
         SUM(up.total_points) as team_points
       FROM teams t
       JOIN users u ON t.team_leader = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN team_members tm_user ON t.id = tm_user.team_id AND tm_user.user_id = $${params.length + 1}
       LEFT JOIN user_points up ON tm.user_id = up.user_id
       ${whereClause}
       GROUP BY t.id, u.first_name, tm_user.user_id
       ORDER BY team_points DESC NULLS LAST, t.created_at DESC`,
      [...params, userId],
    )

    const response = res.json({ teams })
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch teams' })
  }
})

// Create team
router.post('/', authMiddleware(), async (req: any, res) => {
  try {
    const validatedData = CreateTeamSchema.parse(req.body)
    const userId = req.user.id

    const [team] = await db.query(
      `INSERT INTO teams (name, description, department, team_leader, max_members)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [validatedData.name, validatedData.description, validatedData.department, userId, validatedData.maxMembers || 10],
    )

    await db.query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)", [team.id, userId, 'leader'])

    const response = res.json({
      message: 'Team created successfully',
      team,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to create team' })
  }
})

// Join team
router.post('/:id/join', authMiddleware(), async (req: any, res) => {
  try {
    const userId = req.user.id
    const teamId = req.params.id

    const [team] = await db.query("SELECT * FROM teams WHERE id = $1 AND is_active = true", [teamId])

    if (!team) {
      return res.status(404).json({ error: 'Team not found or inactive' })
    }

    const [existing] = await db.query("SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2", [
      teamId,
      userId,
    ])

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this team' })
    }

    const [memberCount] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE team_id = $1", [teamId])

    if (parseInt(memberCount.count) >= team.max_members) {
      return res.status(400).json({ error: 'Team is full' })
    }

    await db.query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)", [
      teamId,
      userId,
      'member',
    ])

    const response = res.json({
      message: 'Successfully joined team',
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to join team' })
  }
})

export { router }