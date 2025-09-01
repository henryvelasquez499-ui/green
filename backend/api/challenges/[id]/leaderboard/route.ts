import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../../auth/middleware"
import { DatabaseManager } from "../../../../config/database"
import { securityHeaders } from "../../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Get challenge leaderboard
    const leaderboard = await db.query(
      `SELECT 
         u.id,
         u.first_name,
         u.last_name,
         u.department,
         cp.current_progress,
         cp.completed,
         cp.completed_at,
         ROW_NUMBER() OVER (ORDER BY cp.current_progress DESC, cp.completed_at ASC) as rank
       FROM challenge_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.challenge_id = $1
       ORDER BY cp.current_progress DESC, cp.completed_at ASC`,
      [params.id],
    )

    // Find user's position
    const userPosition = leaderboard.findIndex((entry) => entry.id === userId)

    // Get challenge details for context
    const [challenge] = await db.query(
      "SELECT title, target_metric, target_value, challenge_type FROM challenges WHERE id = $1",
      [params.id],
    )

    const response = NextResponse.json({
      challenge,
      leaderboard,
      userPosition: userPosition >= 0 ? userPosition + 1 : null,
      summary: {
        totalParticipants: leaderboard.length,
        completedCount: leaderboard.filter((entry) => entry.completed).length,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch challenge leaderboard" }, { status: 500 })
  }
}
