import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { PointsCalculator } from "../../../services/points"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const pointsCalc = new PointsCalculator()
const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get("timeframe") as "weekly" | "monthly" | "all") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const userId = (request as any).user.id

    // Get main leaderboard
    const leaderboard = await pointsCalc.calculateLeaderboard(timeframe)
    const topUsers = leaderboard.slice(0, limit)

    // Find current user's position
    const userPosition = leaderboard.findIndex((entry) => entry.userId === userId)
    const userEntry = userPosition >= 0 ? leaderboard[userPosition] : null

    // Get department leaderboard if user has department
    const [user] = await db.query("SELECT department FROM users WHERE id = $1", [userId])
    let departmentLeaderboard = null

    if (user?.department) {
      const pointsColumn =
        timeframe === "weekly" ? "weekly_points" : timeframe === "monthly" ? "monthly_points" : "total_points"

      departmentLeaderboard = await db.query(
        `SELECT 
           u.id as user_id,
           u.first_name,
           u.last_name,
           up.${pointsColumn} as total_points,
           ROW_NUMBER() OVER (ORDER BY up.${pointsColumn} DESC) as rank
         FROM users u
         JOIN user_points up ON u.id = up.user_id
         WHERE u.is_active = true AND u.department = $1
         ORDER BY up.${pointsColumn} DESC
         LIMIT $2`,
        [user.department, limit],
      )
    }

    const response = NextResponse.json({
      timeframe,
      globalLeaderboard: topUsers,
      departmentLeaderboard,
      userPosition: {
        rank: userPosition + 1,
        entry: userEntry,
      },
      summary: {
        totalParticipants: leaderboard.length,
        userRank: userPosition + 1,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status: 500 })
  }
}
