import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../../auth/middleware"
import { DatabaseManager } from "../../../../config/database"
import { ImpactCalculator } from "../../../../services/impact"
import { securityHeaders } from "../../../../middleware/security"

const db = DatabaseManager.getInstance()
const impactCalc = new ImpactCalculator()

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()

    // Company-wide metrics
    const [companyMetrics] = await db.query(
      `SELECT 
         COUNT(DISTINCT u.id) as total_active_users,
         COUNT(sa.id) as total_actions,
         SUM(sa.points_earned) as total_points,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as total_co2_saved,
         SUM(CASE WHEN sa.impact_unit = 'kwh' THEN sa.impact_value ELSE 0 END) as total_energy_saved,
         SUM(CASE WHEN sa.impact_unit = 'liters' THEN sa.impact_value ELSE 0 END) as total_water_saved
       FROM users u
       LEFT JOIN sustainability_actions sa ON u.id = sa.user_id 
         AND sa.verification_status = 'verified'
         AND sa.action_date >= $1 AND sa.action_date <= $2
       WHERE u.is_active = true`,
      [startDate, endDate],
    )

    // Department breakdown
    const departmentBreakdown = await db.query(
      `SELECT 
         u.department,
         COUNT(DISTINCT u.id) as user_count,
         COUNT(sa.id) as action_count,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as co2_saved,
         AVG(up.total_points) as avg_points_per_user
       FROM users u
       LEFT JOIN sustainability_actions sa ON u.id = sa.user_id 
         AND sa.verification_status = 'verified'
         AND sa.action_date >= $1 AND sa.action_date <= $2
       LEFT JOIN user_points up ON u.id = up.user_id
       WHERE u.is_active = true AND u.department IS NOT NULL
       GROUP BY u.department
       ORDER BY co2_saved DESC`,
      [startDate, endDate],
    )

    // Monthly trends
    const monthlyTrends = await db.query(
      `SELECT 
         DATE_TRUNC('month', sa.action_date) as month,
         COUNT(sa.id) as action_count,
         COUNT(DISTINCT sa.user_id) as active_users,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as co2_saved
       FROM sustainability_actions sa
       WHERE sa.verification_status = 'verified'
         AND sa.action_date >= $1 AND sa.action_date <= $2
       GROUP BY DATE_TRUNC('month', sa.action_date)
       ORDER BY month`,
      [startDate, endDate],
    )

    // Category impact
    const categoryImpact = await db.query(
      `SELECT 
         ac.name,
         COUNT(sa.id) as action_count,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as co2_saved,
         SUM(CASE WHEN sa.impact_unit = 'kwh' THEN sa.impact_value ELSE 0 END) as energy_saved
       FROM action_categories ac
       LEFT JOIN sustainability_actions sa ON ac.id = sa.category_id
         AND sa.verification_status = 'verified'
         AND sa.action_date >= $1 AND sa.action_date <= $2
       GROUP BY ac.id, ac.name
       ORDER BY co2_saved DESC`,
      [startDate, endDate],
    )

    // Engagement metrics
    const [engagementMetrics] = await db.query(
      `SELECT 
         COUNT(DISTINCT CASE WHEN sa.action_date >= NOW() - INTERVAL '30 days' THEN sa.user_id END) as monthly_active_users,
         COUNT(DISTINCT CASE WHEN sa.action_date >= NOW() - INTERVAL '7 days' THEN sa.user_id END) as weekly_active_users,
         AVG(up.current_streak) as avg_streak,
         COUNT(DISTINCT ub.user_id) as users_with_badges
       FROM sustainability_actions sa
       FULL OUTER JOIN user_points up ON sa.user_id = up.user_id
       FULL OUTER JOIN user_badges ub ON sa.user_id = ub.user_id
       WHERE sa.verification_status = 'verified' OR sa.verification_status IS NULL`,
      [],
    )

    const response = NextResponse.json({
      reportPeriod: { startDate, endDate },
      companyMetrics: {
        totalActiveUsers: Number.parseInt(companyMetrics?.total_active_users || "0"),
        totalActions: Number.parseInt(companyMetrics?.total_actions || "0"),
        totalPoints: Number.parseInt(companyMetrics?.total_points || "0"),
        totalCO2Saved: Number.parseFloat(companyMetrics?.total_co2_saved || "0"),
        totalEnergySaved: Number.parseFloat(companyMetrics?.total_energy_saved || "0"),
        totalWaterSaved: Number.parseFloat(companyMetrics?.total_water_saved || "0"),
      },
      departmentBreakdown,
      monthlyTrends,
      categoryImpact,
      engagementMetrics: {
        monthlyActiveUsers: Number.parseInt(engagementMetrics?.monthly_active_users || "0"),
        weeklyActiveUsers: Number.parseInt(engagementMetrics?.weekly_active_users || "0"),
        avgStreak: Number.parseFloat(engagementMetrics?.avg_streak || "0"),
        usersWithBadges: Number.parseInt(engagementMetrics?.users_with_badges || "0"),
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate ESG report" }, { status: 500 })
  }
}
