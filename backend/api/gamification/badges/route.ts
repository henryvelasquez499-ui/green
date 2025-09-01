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

    // Get user's earned badges
    const earnedBadges = await badgeService.getUserBadges(userId)

    // Get all available badges with progress
    const allBadges = await db.query(
      `SELECT b.*, 
        CASE WHEN ub.badge_id IS NOT NULL THEN true ELSE false END as earned,
        ub.earned_at
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
       WHERE b.is_active = true
       ORDER BY earned DESC, b.rarity, b.name`,
      [userId],
    )

    // Calculate progress for unearned badges
    const badgesWithProgress = await Promise.all(
      allBadges.map(async (badge) => {
        if (badge.earned) {
          return { ...badge, progress: 100 }
        }

        let progress = 0
        switch (badge.criteria_type) {
          case "action_count":
            const [actionCount] = await db.query(
              badge.category_id
                ? "SELECT COUNT(*) as count FROM sustainability_actions WHERE user_id = $1 AND category_id = $2"
                : "SELECT COUNT(*) as count FROM sustainability_actions WHERE user_id = $1",
              badge.category_id ? [userId, badge.category_id] : [userId],
            )
            progress = Math.min((Number.parseInt(actionCount.count) / badge.criteria_value) * 100, 100)
            break

          case "points_total":
            const [userPoints] = await db.query("SELECT total_points FROM user_points WHERE user_id = $1", [userId])
            progress = Math.min(((userPoints?.total_points || 0) / badge.criteria_value) * 100, 100)
            break

          case "streak_days":
            const [streakData] = await db.query("SELECT current_streak FROM user_points WHERE user_id = $1", [userId])
            progress = Math.min(((streakData?.current_streak || 0) / badge.criteria_value) * 100, 100)
            break
        }

        return { ...badge, progress: Math.round(progress) }
      }),
    )

    const response = NextResponse.json({
      earnedBadges,
      allBadges: badgesWithProgress,
      summary: {
        totalEarned: earnedBadges.length,
        totalAvailable: allBadges.length,
        completionPercentage: Math.round((earnedBadges.length / allBadges.length) * 100),
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch badges" }, { status: 500 })
  }
}
