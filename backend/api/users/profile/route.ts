import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { UserRepository } from "../../../repositories/UserRepository"
import { UpdateProfileSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const userRepo = new UserRepository()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const user = await userRepo.findById((request as any).user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userStats = await userRepo.getUserStats(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      stats: userStats,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = UpdateProfileSchema.parse(body)

    const updatedUser = await userRepo.update((request as any).user.id, validatedData)

    const response = NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        department: updatedUser.department,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 400 })
  }
}
