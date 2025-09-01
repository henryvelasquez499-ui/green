import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../../auth/middleware"
import { ChallengeService } from "../../../../services/challenges"
import { securityHeaders } from "../../../../middleware/security"

const challengeService = new ChallengeService()

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    await challengeService.joinChallenge(userId, params.id)

    const response = NextResponse.json({
      message: "Successfully joined challenge",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to join challenge" }, { status: 400 })
  }
}
