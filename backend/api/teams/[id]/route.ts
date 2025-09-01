import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Get team details
    const [team] = await db.query(
      `SELECT 
         t.*,
         u.first_name as leader_name,
         COUNT(tm.user_id) as member_count,
         CASE WHEN tm_user.user_id IS NOT NULL THEN true ELSE false END as user_joined,
         tm_user.role as user_role
       FROM teams t
       JOIN users u ON t.team_leader = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN team_members tm_user ON t.id = tm_user.team_id AND tm_user.user_id = $2
       WHERE t.id = $1
       GROUP BY t.id, u.first_name, tm_user.user_id, tm_user.role`,
      [params.id, userId],
    )

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get team statistics
    const [teamStats] = await db.query(
      `SELECT 
         COUNT(tm.user_id) as total_members,
         SUM(up.total_points) as total_points,
         SUM(up.monthly_points) as monthly_points,
         COUNT(sa.id) as total_actions
       FROM team_members tm
       LEFT JOIN user_points up ON tm.user_id = up.user_id
       LEFT JOIN sustainability_actions sa ON tm.user_id = sa.user_id
       WHERE tm.team_id = $1`,
      [params.id],
    )

    const response = NextResponse.json({
      team,
      stats: teamStats || {
        total_members: 0,
        total_points: 0,
        monthly_points: 0,
        total_actions: 0,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch team" }, { status: 500 })
  }
}
