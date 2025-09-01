import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../auth/middleware"
import { ActionRepository } from "../../repositories/ActionRepository"
import { PointsCalculator } from "../../services/points"
import { BadgeService } from "../../services/badges"
import { CreateActionSchema } from "../../validation/schemas"
import { securityHeaders } from "../../middleware/security"

const actionRepo = new ActionRepository()
const pointsCalc = new PointsCalculator()
const badgeService = new BadgeService()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const userId = (request as any).user.id
    const actions = await actionRepo.findByUserId(userId, limit, offset)

    const response = NextResponse.json({
      actions,
      pagination: {
        limit,
        offset,
        hasMore: actions.length === limit,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch actions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = CreateActionSchema.parse(body)

    const userId = (request as any).user.id

    // Create action
    const action = await actionRepo.create({
      userId,
      categoryId: validatedData.categoryId,
      title: validatedData.title,
      description: validatedData.description,
      impactValue: validatedData.impactValue,
      impactUnit: validatedData.impactUnit,
      actionDate: new Date(validatedData.actionDate),
    })

    // Calculate and award points
    const points = await pointsCalc.calculateActionPoints(action)
    await pointsCalc.updateUserPoints(userId, points, action.id)

    // Update action with earned points
    await actionRepo.update(action.id, { pointsEarned: points })

    // Check for badge eligibility
    await badgeService.processAutomaticBadgeAwards(userId)

    const response = NextResponse.json({
      message: "Action logged successfully",
      action: { ...action, pointsEarned: points },
      pointsEarned: points,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create action" }, { status: 400 })
  }
}
