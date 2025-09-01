import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Get challenge details
    const [challenge] = await db.query(
      `SELECT 
         c.*,
         u.first_name as creator_name,
         COUNT(cp.user_id) as participant_count,
         CASE WHEN cp_user.user_id IS NOT NULL THEN true ELSE false END as user_joined,
         cp_user.current_progress as user_progress,
         cp_user.completed as user_completed
       FROM challenges c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
       LEFT JOIN challenge_participants cp_user ON c.id = cp_user.challenge_id AND cp_user.user_id = $2
       WHERE c.id = $1
       GROUP BY c.id, u.first_name, cp_user.user_id, cp_user.current_progress, cp_user.completed`,
      [params.id, userId],
    )

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    // Get top participants
    const topParticipants = await db.query(
      `SELECT 
         u.first_name,
         u.last_name,
         cp.current_progress,
         cp.completed,
         ROW_NUMBER() OVER (ORDER BY cp.current_progress DESC) as rank
       FROM challenge_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.challenge_id = $1
       ORDER BY cp.current_progress DESC
       LIMIT 10`,
      [params.id],
    )

    const response = NextResponse.json({
      challenge,
      topParticipants,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch challenge" }, { status: 500 })
  }
}
