import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { BadgeService } from "../../../services/badges"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const badgeService = new BadgeService()
const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Get recent achievements (last 30 days)
    const recentAchievements = await db.query(
      `SELECT b.name, b.description, b.icon_url, b.rarity, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1 AND ub.earned_at >= NOW() - INTERVAL '30 days'
       ORDER BY ub.earned_at DESC`,
      [userId],
    )

    // Get achievement milestones
    const milestones = await db.query(
      `SELECT 
         'actions' as type, COUNT(*) as current, 
         CASE 
           WHEN COUNT(*) >= 100 THEN 100
           WHEN COUNT(*) >= 50 THEN 50
           WHEN COUNT(*) >= 25 THEN 25
           WHEN COUNT(*) >= 10 THEN 10
           ELSE 5
         END as next_milestone
       FROM sustainability_actions WHERE user_id = $1
       UNION ALL
       SELECT 
         'points' as type, COALESCE(total_points, 0) as current,
         CASE 
           WHEN COALESCE(total_points, 0) >= 5000 THEN 5000
           WHEN COALESCE(total_points, 0) >= 2500 THEN 2500
           WHEN COALESCE(total_points, 0) >= 1000 THEN 1000
           WHEN COALESCE(total_points, 0) >= 500 THEN 500
           ELSE 100
         END as next_milestone
       FROM user_points WHERE user_id = $1`,
      [userId],
    )

    // Check for claimable badges
    const claimableBadges = await badgeService.checkBadgeEligibility(userId)

    const response = NextResponse.json({
      recentAchievements,
      milestones,
      claimableBadges,
      summary: {
        recentCount: recentAchievements.length,
        claimableCount: claimableBadges.length,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch achievements" }, { status: 500 })
  }
}
