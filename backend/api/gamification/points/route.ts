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

    // Get user points summary
    const userStats = await userRepo.getUserStats(userId)

    // Get recent point transactions
    const recentTransactions = await db.query(
      `SELECT points, transaction_type, description, created_at
       FROM point_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId],
    )

    // Get points breakdown by category
    const categoryBreakdown = await db.query(
      `SELECT ac.name, ac.color, SUM(sa.points_earned) as total_points, COUNT(*) as action_count
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1 AND sa.verification_status = 'verified'
       GROUP BY ac.id, ac.name, ac.color
       ORDER BY total_points DESC`,
      [userId],
    )

    const response = NextResponse.json({
      summary: userStats,
      recentTransactions,
      categoryBreakdown,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch points data" }, { status: 500 })
  }
}
