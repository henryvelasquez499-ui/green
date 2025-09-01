import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { UserRepository } from "../../../repositories/UserRepository"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const userRepo = new UserRepository()
const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Get user stats
    const userStats = await userRepo.getUserStats(userId)

    // Get progress over time (last 30 days)
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

    // Get category progress
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

    // Calculate weekly and monthly trends
    const [weeklyTrend] = await db.query(
      `SELECT 
         COUNT(*) as this_week_actions,
         COALESCE(SUM(points_earned), 0) as this_week_points,
         (SELECT COUNT(*) FROM sustainability_actions 
          WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '14 days' 
          AND created_at < NOW() - INTERVAL '7 days') as last_week_actions
       FROM sustainability_actions 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
      [userId],
    )

    const response = NextResponse.json({
      userStats,
      progressData,
      categoryProgress,
      trends: {
        weekly: {
          thisWeek: {
            actions: weeklyTrend?.this_week_actions || 0,
            points: weeklyTrend?.this_week_points || 0,
          },
          lastWeek: {
            actions: weeklyTrend?.last_week_actions || 0,
          },
          change: {
            actions: (weeklyTrend?.this_week_actions || 0) - (weeklyTrend?.last_week_actions || 0),
          },
        },
      },\
    )

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch progress data" }, { status: 500 })
  }
}
