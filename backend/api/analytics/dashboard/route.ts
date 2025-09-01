import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { ImpactCalculator } from "../../../services/impact"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const impactCalc = new ImpactCalculator()
const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30" // days

    // Get personal analytics summary
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

    // Get daily activity for chart
    const dailyActivity = await db.query(
      `SELECT 
         DATE(action_date) as date,
         COUNT(*) as actions_count,
         SUM(points_earned) as points_earned,
         SUM(CASE WHEN impact_unit = 'kg_co2' THEN impact_value ELSE 0 END) as co2_saved
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= NOW() - INTERVAL '${timeframe} days'
       GROUP BY DATE(action_date)
       ORDER BY date`,
      [userId],
    )

    // Get category breakdown
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

    // Get streak information
    const [streakInfo] = await db.query("SELECT current_streak, longest_streak FROM user_points WHERE user_id = $1", [
      userId,
    ])

    const response = NextResponse.json({
      timeframe: Number.parseInt(timeframe),
      summary: {
        totalActions: Number.parseInt(summary?.total_actions || "0"),
        totalPoints: Number.parseInt(summary?.total_points || "0"),
        co2Saved: Number.parseFloat(summary?.co2_saved || "0"),
        energySaved: Number.parseFloat(summary?.energy_saved || "0"),
        waterSaved: Number.parseFloat(summary?.water_saved || "0"),
        activeDays: Number.parseInt(summary?.active_days || "0"),
        currentStreak: streakInfo?.current_streak || 0,
        longestStreak: streakInfo?.longest_streak || 0,
      },
      dailyActivity,
      categoryBreakdown,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard analytics" }, { status: 500 })
  }
}
