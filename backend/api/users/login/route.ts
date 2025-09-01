import { type NextRequest, NextResponse } from "next/server"
import { TraditionalAuth } from "../../../auth/strategies/traditional"
import { UserRepository } from "../../../repositories/UserRepository"
import { LoginSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const auth = new TraditionalAuth()
const userRepo = new UserRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = LoginSchema.parse(body)

    // Find user
    const user = await userRepo.findByEmail(validatedData.email)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValid = await auth.verifyPassword(validatedData.password, user.id)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email before logging in" }, { status: 401 })
    }

    // Generate tokens
    const accessToken = await auth.generateAccessToken(user.id, user.role)
    const refreshToken = await auth.generateRefreshToken(user.id)

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 400 })
  }
}
