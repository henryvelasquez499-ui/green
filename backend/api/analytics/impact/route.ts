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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Default to last 90 days if no dates provided
    const dateRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    }

    // Get user actions for the period
    const actions = await db.query(
      `SELECT * FROM sustainability_actions 
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= $2 AND action_date <= $3
       ORDER BY action_date`,
      [userId, dateRange.start, dateRange.end],
    )

    // Calculate comprehensive impact
    const impactReport = await impactCalc.generateImpactReport(userId, dateRange)

    // Get monthly impact trends
    const monthlyTrends = await db.query(
      `SELECT 
         DATE_TRUNC('month', action_date) as month,
         COUNT(*) as actions_count,
         SUM(CASE WHEN impact_unit = 'kg_co2' THEN impact_value ELSE 0 END) as co2_saved,
         SUM(CASE WHEN impact_unit = 'kwh' THEN impact_value ELSE 0 END) as energy_saved,
         SUM(CASE WHEN impact_unit = 'liters' THEN impact_value ELSE 0 END) as water_saved
       FROM sustainability_actions
       WHERE user_id = $1 
       AND verification_status = 'verified'
       AND action_date >= $2 AND action_date <= $3
       GROUP BY DATE_TRUNC('month', action_date)
       ORDER BY month`,
      [userId, dateRange.start, dateRange.end],
    )

    // Get impact by category with equivalencies
    const categoryImpact = await db.query(
      `SELECT 
         ac.name,
         ac.color,
         COUNT(sa.id) as action_count,
         SUM(CASE WHEN sa.impact_unit = 'kg_co2' THEN sa.impact_value ELSE 0 END) as co2_saved,
         SUM(CASE WHEN sa.impact_unit = 'kwh' THEN sa.impact_value ELSE 0 END) as energy_saved,
         SUM(CASE WHEN sa.impact_unit = 'liters' THEN sa.impact_value ELSE 0 END) as water_saved
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1 
       AND sa.verification_status = 'verified'
       AND sa.action_date >= $2 AND sa.action_date <= $3
       GROUP BY ac.id, ac.name, ac.color
       ORDER BY co2_saved DESC`,
      [userId, dateRange.start, dateRange.end],
    )

    // Calculate real-world equivalencies
    const totalCO2 = impactReport.co2Reduction
    const equivalencies = {
      treesPlanted: Math.round(totalCO2 / 21), // 1 tree absorbs ~21kg CO2/year
      carMilesAvoided: Math.round(totalCO2 / 0.404), // Average car emits 404g CO2/mile
      phoneCharges: Math.round((impactReport.energyConservation * 1000) / 8.22), // Phone charge uses ~8.22Wh
      showerMinutes: Math.round(impactReport.waterConservation / 9.5), // Average shower uses 9.5L/min
    }

    const response = NextResponse.json({
      dateRange,
      impactReport,
      monthlyTrends,
      categoryImpact,
      equivalencies,
      summary: {
        totalActions: actions.length,
        totalCO2Saved: impactReport.co2Reduction,
        totalEnergySaved: impactReport.energyConservation,
        totalWaterSaved: impactReport.waterConservation,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch impact analytics" }, { status: 500 })
  }
}
