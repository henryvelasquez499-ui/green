import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../backend/auth/middleware"
import { DatabaseManager } from "../../../backend/config/database"
import { CreateTeamSchema } from "../../../backend/validation/schemas"
import { securityHeaders } from "../../../backend/middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")
    const userId = (request as any).user.id

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

    const response = NextResponse.json({ teams })
    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch teams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = CreateTeamSchema.parse(body)

    const userId = (request as any).user.id

    // Create team
    const [team] = await db.query(
      `INSERT INTO teams (name, description, department, team_leader, max_members)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [validatedData.name, validatedData.description, validatedData.department, userId, validatedData.maxMembers || 10],
    )

    // Add creator as team member
    await db.query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)", [team.id, userId, "leader"])

    const response = NextResponse.json({
      message: "Team created successfully",
      team,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create team" }, { status: 400 })
  }
}
