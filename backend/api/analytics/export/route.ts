import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { ImpactCalculator } from "../../../services/impact"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()
const impactCalc = new ImpactCalculator()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const includePersonalData = searchParams.get("includePersonalData") === "true"

    // Default to last year if no dates provided
    const dateRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    }

    // Get comprehensive user data
    const userData = includePersonalData
      ? await db.query("SELECT first_name, last_name, email, department, created_at FROM users WHERE id = $1", [userId])
      : null

    // Get all actions in date range
    const actions = await db.query(
      `SELECT 
         sa.*,
         ac.name as category_name
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1 
       AND sa.action_date >= $2 AND sa.action_date <= $3
       ORDER BY sa.action_date DESC`,
      [userId, dateRange.start, dateRange.end],
    )

    // Get impact summary
    const impactReport = await impactCalc.generateImpactReport(userId, dateRange)

    // Get points summary
    const [pointsSummary] = await db.query(
      `SELECT 
         SUM(points) as total_points_earned,
         COUNT(*) as total_transactions
       FROM point_transactions
       WHERE user_id = $1 
       AND created_at >= $2 AND created_at <= $3`,
      [userId, dateRange.start, dateRange.end],
    )

    // Get badges earned in period
    const badges = await db.query(
      `SELECT 
         b.name,
         b.description,
         b.rarity,
         ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1 
       AND ub.earned_at >= $2 AND ub.earned_at <= $3
       ORDER BY ub.earned_at DESC`,
      [userId, dateRange.start, dateRange.end],
    )

    const exportData = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        dateRange,
        format,
        includePersonalData,
      },
      user: userData?.[0] || null,
      summary: {
        totalActions: actions.length,
        totalPointsEarned: Number.parseInt(pointsSummary?.total_points_earned || "0"),
        totalBadgesEarned: badges.length,
        impactReport,
      },
      actions,
      badges,
    }

    if (format === "csv") {
      // Generate CSV for actions
      const csvHeaders = "Date,Title,Category,Description,Impact Value,Impact Unit,Points Earned,Status\n"
      const csvRows = actions
        .map(
          (action) =>
            `${action.action_date},"${action.title}","${action.category_name}","${action.description || ""}",${action.impact_value || ""},${action.impact_unit || ""},${action.points_earned},${action.verification_status}`,
        )
        .join("\n")

      const response = new NextResponse(csvHeaders + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=sustainability-analytics-${userId}-${Date.now()}.csv`,
        },
      })

      return securityHeaders(response)
    }

    // Default JSON format
    const response = NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename=sustainability-analytics-${userId}-${Date.now()}.json`,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export analytics data" }, { status: 500 })
  }
}
