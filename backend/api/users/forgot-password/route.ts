import { type NextRequest, NextResponse } from "next/server"
import { TraditionalAuth } from "../../../auth/strategies/traditional"
import { UserRepository } from "../../../repositories/UserRepository"
import { EmailService } from "../../../services/email"
import { securityHeaders } from "../../../middleware/security"

const auth = new TraditionalAuth()
const userRepo = new UserRepository()
const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Find user
    const user = await userRepo.findByEmail(email)
    if (!user || !user.isActive) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Generate reset token
    const resetToken = await auth.generatePasswordResetToken(user.id)

    // Send reset email
    await emailService.sendPasswordReset(user.email, resetToken)

    const response = NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: "Password reset request failed" }, { status: 500 })
  }
}
