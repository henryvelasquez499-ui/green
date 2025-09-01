import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../../auth/middleware"
import { DatabaseManager } from "../../../../config/database"
import { securityHeaders } from "../../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Check if user is in challenge
    const [participation] = await db.query(
      "SELECT id FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
      [params.id, userId],
    )

    if (!participation) {
      return NextResponse.json({ error: "Not participating in this challenge" }, { status: 400 })
    }

    // Remove from challenge
    await db.query("DELETE FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2", [params.id, userId])

    const response = NextResponse.json({
      message: "Successfully left challenge",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to leave challenge" }, { status: 500 })
  }
}
