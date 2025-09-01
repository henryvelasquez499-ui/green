import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../../../auth/middleware"
import { DatabaseManager } from "../../../../../config/database"
import { securityHeaders } from "../../../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get user activity log
    const activities = await db.query(
      `SELECT 
         event_type,
         event_data,
         ip_address,
         user_agent,
         created_at
       FROM user_analytics
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [params.id, limit, offset],
    )

    // Get recent actions
    const recentActions = await db.query(
      `SELECT 
         sa.*,
         ac.name as category_name
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1
       ORDER BY sa.created_at DESC
       LIMIT 10`,
      [params.id],
    )

    // Get login history
    const loginHistory = await db.query(
      `SELECT 
         created_at,
         ip_address,
         user_agent
       FROM user_analytics
       WHERE user_id = $1 AND event_type = 'login'
       ORDER BY created_at DESC
       LIMIT 10`,
      [params.id],
    )

    const response = NextResponse.json({
      activities,
      recentActions,
      loginHistory,
      pagination: {
        limit,
        offset,
        hasMore: activities.length === limit,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch user activity" }, { status: 500 })
  }
}
