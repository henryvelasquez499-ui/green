import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../backend/auth/middleware"
import { ChallengeService } from "../../../backend/services/challenges"
import { DatabaseManager } from "../../../backend/config/database"
import { CreateChallengeSchema } from "../../../backend/validation/schemas"
import { securityHeaders } from "../../../backend/middleware/security"

const challengeService = new ChallengeService()
const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"
    const type = searchParams.get("type")

    let whereClause = "WHERE c.is_active = true"
    const params: any[] = []

    if (status === "active") {
      whereClause += " AND c.start_date <= NOW() AND c.end_date > NOW()"
    } else if (status === "upcoming") {
      whereClause += " AND c.start_date > NOW()"
    } else if (status === "completed") {
      whereClause += " AND c.end_date <= NOW()"
    }

    if (type) {
      whereClause += ` AND c.challenge_type = $${params.length + 1}`
      params.push(type)
    }

    const challenges = await db.query(
      `SELECT 
         c.*,
         u.first_name as creator_name,
         COUNT(cp.user_id) as participant_count,
         CASE WHEN cp_user.user_id IS NOT NULL THEN true ELSE false END as user_joined
       FROM challenges c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
       LEFT JOIN challenge_participants cp_user ON c.id = cp_user.challenge_id AND cp_user.user_id = $${params.length + 1}
       ${whereClause}
       GROUP BY c.id, u.first_name, cp_user.user_id
       ORDER BY c.start_date DESC`,
      [...params, (request as any).user.id],
    )

    const response = NextResponse.json({ challenges })
    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch challenges" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware("admin")(request as any)
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
