import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Get weekly trends (last 12 weeks)
    const weeklyTrends = await db.query(
      `SELECT 
         DATE_TRUNC('week', action_date) as week,
         COUNT(*) as actions_count,
         SUM(points_earned) as points_earned,
         SUM(CASE WHEN impact_unit = 'kg_co2' THEN impact_value ELSE 0 END) as co2_saved,
         COUNT(DISTINCT DATE(action_date)) as active_days
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= NOW() - INTERVAL '12 weeks'
       GROUP BY DATE_TRUNC('week', action_date)
       ORDER BY week`,
      [userId],
    )

    // Get monthly trends (last 12 months)
    const monthlyTrends = await db.query(
      `SELECT 
         DATE_TRUNC('month', action_date) as month,
         COUNT(*) as actions_count,
         SUM(points_earned) as points_earned,
         SUM(CASE WHEN impact_unit = 'kg_co2' THEN impact_value ELSE 0 END) as co2_saved,
         COUNT(DISTINCT DATE(action_date)) as active_days
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', action_date)
       ORDER BY month`,
      [userId],
    )

    // Get day of week patterns
    const dayOfWeekPattern = await db.query(
      `SELECT 
         EXTRACT(DOW FROM action_date) as day_of_week,
         COUNT(*) as actions_count,
         AVG(points_earned) as avg_points
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= NOW() - INTERVAL '3 months'
       GROUP BY EXTRACT(DOW FROM action_date)
       ORDER BY day_of_week`,
      [userId],
    )

    // Get hour of day patterns
    const hourOfDayPattern = await db.query(
      `SELECT 
         EXTRACT(HOUR FROM created_at) as hour_of_day,
         COUNT(*) as actions_count
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND created_at >= NOW() - INTERVAL '3 months'
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour_of_day`,
      [userId],
    )

    // Calculate trend analysis
    const recentWeeks = weeklyTrends.slice(-4) // Last 4 weeks
    const previousWeeks = weeklyTrends.slice(-8, -4) // Previous 4 weeks

    const recentAvg =
      recentWeeks.reduce((sum, week) => sum + Number.parseInt(week.actions_count), 0) / recentWeeks.length
    const previousAvg =
      previousWeeks.reduce((sum, week) => sum + Number.parseInt(week.actions_count), 0) / previousWeeks.length

    const trendAnalysis = {
      direction: recentAvg > previousAvg ? "increasing" : recentAvg < previousAvg ? "decreasing" : "stable",
      changePercentage: previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0,
      recentAverage: Math.round(recentAvg),
      previousAverage: Math.round(previousAvg),
    }

    const response = NextResponse.json({
      weeklyTrends,
      monthlyTrends,
      patterns: {
        dayOfWeek: dayOfWeekPattern.map((row) => ({
          day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
            Number.parseInt(row.day_of_week)
          ],
          actionsCount: Number.parseInt(row.actions_count),
          avgPoints: Number.parseFloat(row.avg_points || "0"),
        })),
        hourOfDay: hourOfDayPattern.map((row) => ({
          hour: Number.parseInt(row.hour_of_day),
          actionsCount: Number.parseInt(row.actions_count),
        })),
      },
      trendAnalysis,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch trend analytics" }, { status: 500 })
  }
}
