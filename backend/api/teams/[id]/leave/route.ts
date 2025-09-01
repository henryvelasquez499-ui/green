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

    // Check if user is in team
    const [membership] = await db.query("SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2", [
      params.id,
      userId,
    ])

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this team" }, { status: 400 })
    }

    // Check if user is team leader
    if (membership.role === "leader") {
      // Check if there are other members
      const [memberCount] = await db.query(
        "SELECT COUNT(*) as count FROM team_members WHERE team_id = $1 AND user_id != $2",
        [params.id, userId],
      )

      if (Number.parseInt(memberCount.count) > 0) {
        return NextResponse.json(
          { error: "Cannot leave team as leader. Transfer leadership or disband team first." },
          { status: 400 },
        )
      }

      // If no other members, deactivate the team
      await db.query("UPDATE teams SET is_active = false WHERE id = $1", [params.id])
    }

    // Remove from team
    await db.query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2", [params.id, userId])

    const response = NextResponse.json({
      message: "Successfully left team",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to leave team" }, { status: 500 })
  }
}
