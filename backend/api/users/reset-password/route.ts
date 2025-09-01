import { type NextRequest, NextResponse } from "next/server"
import { TraditionalAuth } from "../../../auth/strategies/traditional"
import { UserRepository } from "../../../repositories/UserRepository"
import { ResetPasswordSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const auth = new TraditionalAuth()
const userRepo = new UserRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ResetPasswordSchema.parse(body)

    // Verify reset token
    const userId = await auth.verifyPasswordResetToken(validatedData.token)

    // Hash new password
    const passwordHash = await auth.hashPassword(validatedData.password)

    // Update user password (this will be handled by the auth service)
    await auth.updatePassword(userId, passwordHash)

    const response = NextResponse.json({
      message: "Password reset successfully",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Password reset failed" }, { status: 400 })
  }
}
