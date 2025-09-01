import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../../auth/middleware"
import { BadgeService } from "../../../../services/badges"
import { securityHeaders } from "../../../../middleware/security"

const badgeService = new BadgeService()

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { badgeId } = await request.json()
    const userId = (request as any).user.id

    if (!badgeId) {
      return NextResponse.json({ error: "Badge ID required" }, { status: 400 })
    }

    // Check if user is eligible for this badge
    const eligibleBadges = await badgeService.checkBadgeEligibility(userId)
    const isEligible = eligibleBadges.some((badge) => badge.id === badgeId)

    if (!isEligible) {
      return NextResponse.json({ error: "Not eligible for this badge" }, { status: 400 })
    }

    // Award the badge
    await badgeService.awardBadge(userId, badgeId)

    const response = NextResponse.json({
      message: "Badge claimed successfully!",
      badgeId,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to claim badge" }, { status: 400 })
  }
}
