import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { ActionRepository } from "../../../repositories/ActionRepository"
import { PointsCalculator } from "../../../services/points"
import { BadgeService } from "../../../services/badges"
import { BulkCreateActionsSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const actionRepo = new ActionRepository()
const pointsCalc = new PointsCalculator()
const badgeService = new BadgeService()

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = BulkCreateActionsSchema.parse(body)

    const userId = (request as any).user.id
    const createdActions = []
    let totalPoints = 0

    // Create actions sequentially to maintain data integrity
    for (const actionData of validatedData.actions) {
      const action = await actionRepo.create({
        userId,
        categoryId: actionData.categoryId,
        title: actionData.title,
        description: actionData.description,
        impactValue: actionData.impactValue,
        impactUnit: actionData.impactUnit,
        actionDate: new Date(actionData.actionDate),
      })

      // Calculate points
      const points = await pointsCalc.calculateActionPoints(action)
      await actionRepo.update(action.id, { pointsEarned: points })

      createdActions.push({ ...action, pointsEarned: points })
      totalPoints += points
    }

    // Update user points in bulk
    await pointsCalc.updateUserPoints(userId, totalPoints)

    // Check for badge eligibility
    await badgeService.processAutomaticBadgeAwards(userId)

    const response = NextResponse.json({
      message: `${createdActions.length} actions logged successfully`,
      actions: createdActions,
      totalPointsEarned: totalPoints,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create bulk actions" }, { status: 400 })
  }
}
