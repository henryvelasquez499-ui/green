import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../../auth/middleware"
import { DatabaseManager } from "../../../../config/database"
import { securityHeaders } from "../../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    // Get team members with their stats
    const members = await db.query(
      `SELECT 
         u.id,
         u.first_name,
         u.last_name,
         u.department,
         u.avatar_url,
         tm.role,
         tm.joined_at,
         up.total_points,
         up.monthly_points,
         up.current_streak,
         COUNT(sa.id) as total_actions
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN user_points up ON u.id = up.user_id
       LEFT JOIN sustainability_actions sa ON u.id = sa.user_id AND sa.verification_status = 'verified'
       WHERE tm.team_id = $1
       GROUP BY u.id, u.first_name, u.last_name, u.department, u.avatar_url, tm.role, tm.joined_at, up.total_points, up.monthly_points, up.current_streak
       ORDER BY tm.role DESC, up.total_points DESC NULLS LAST`,
      [params.id],
    )

    const response = NextResponse.json({ members })
    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch team members" }, { status: 500 })
  }
}
