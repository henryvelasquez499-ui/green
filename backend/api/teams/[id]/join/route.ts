import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../../auth/middleware"
import { DatabaseManager } from "../../../../config/database"
import { securityHeaders } from "../../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const userId = (request as any).user.id

    // Check if team exists and is active
    const [team] = await db.query("SELECT * FROM teams WHERE id = $1 AND is_active = true", [params.id])

    if (!team) {
      return NextResponse.json({ error: "Team not found or inactive" }, { status: 404 })
    }

    // Check if user is already in team
    const [existing] = await db.query("SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2", [
      params.id,
      userId,
    ])

    if (existing) {
      return NextResponse.json({ error: "Already a member of this team" }, { status: 400 })
    }

    // Check if team is full
    const [memberCount] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE team_id = $1", [params.id])

    if (Number.parseInt(memberCount.count) >= team.max_members) {
      return NextResponse.json({ error: "Team is full" }, { status: 400 })
    }

    // Join team
    await db.query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)", [
      params.id,
      userId,
      "member",
    ])

    const response = NextResponse.json({
      message: "Successfully joined team",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to join team" }, { status: 500 })
  }
}
