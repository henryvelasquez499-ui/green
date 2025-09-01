import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { TraditionalAuth } from "../../../auth/strategies/traditional"
import { securityHeaders } from "../../../middleware/security"

const auth = new TraditionalAuth()

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { refreshToken } = await request.json()

    // Invalidate refresh token if provided
    if (refreshToken) {
      await auth.invalidateRefreshToken(refreshToken)
    }

    const response = NextResponse.json({
      message: "Logged out successfully",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
