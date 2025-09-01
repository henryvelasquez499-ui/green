import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { UserRepository } from "../../../repositories/UserRepository"
import { ActionRepository } from "../../../repositories/ActionRepository"
import { PointsCalculator } from "../../../services/points"
import { securityHeaders } from "../../../middleware/security"

const userRepo = new UserRepository()
const actionRepo = new ActionRepository()
const pointsCalc = new PointsCalculator()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Get user stats
    const userStats = await userRepo.getUserStats(userId)

    // Get recent actions
    const recentActions = await actionRepo.findByUserId(userId, 5)

    // Get leaderboard position
    const leaderboard = await pointsCalc.calculateLeaderboard("monthly")
    const userRank = leaderboard.findIndex((entry) => entry.userId === userId) + 1

    const response = NextResponse.json({
      stats: userStats,
      recentActions,
      leaderboardRank: userRank || null,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard data" }, { status: 500 })
  }
}
