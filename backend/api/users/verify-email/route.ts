import { type NextRequest, NextResponse } from "next/server"
import { TraditionalAuth } from "../../../auth/strategies/traditional"
import { UserRepository } from "../../../repositories/UserRepository"
import { securityHeaders } from "../../../middleware/security"

const auth = new TraditionalAuth()
const userRepo = new UserRepository()

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Verification token required" }, { status: 400 })
    }

    // Verify token and get user ID
    const userId = await auth.verifyEmailToken(token)

    // Update user email verification status
    await userRepo.update(userId, { emailVerified: true })

    const response = NextResponse.json({
      message: "Email verified successfully",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Email verification failed" }, { status: 400 })
  }
}
