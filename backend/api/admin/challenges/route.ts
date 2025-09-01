import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../auth/middleware"
import { ChallengeService } from "../../../services/challenges"
import { DatabaseManager } from "../../../config/database"
import { CreateChallengeSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const challengeService = new ChallengeService()
const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const challenges = await db.query(
      `SELECT 
         c.*,
         u.first_name as creator_name,
         COUNT(cp.user_id) as participant_count
       FROM challenges c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
       GROUP BY c.id, u.first_name
       ORDER BY c.created_at DESC`,
      [],
    )

    const response = NextResponse.json({ challenges })
    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch challenges" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = CreateChallengeSchema.parse(body)

    const createdBy = (request as any).user.id
    const challenge = await challengeService.createChallenge(validatedData, createdBy)

    const response = NextResponse.json({
      message: "Challenge created successfully",
      challenge,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create challenge" }, { status: 400 })
  }
}
