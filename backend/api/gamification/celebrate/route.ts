import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { achievementType, achievementId } = await request.json()
    const userId = (request as any).user.id

    // Log the celebration event for analytics
    await db.query("INSERT INTO user_analytics (user_id, event_type, event_data) VALUES ($1, $2, $3)", [
      userId,
      "achievement_celebrated",
      JSON.stringify({
        achievementType,
        achievementId,
        timestamp: new Date().toISOString(),
      }),
    ])

    // Get celebration message based on achievement type
    let message = "Congratulations on your achievement!"
    if (achievementType === "badge") {
      const [badge] = await db.query("SELECT name FROM badges WHERE id = $1", [achievementId])
      message = `Congratulations on earning the "${badge?.name}" badge! 🎉`
    } else if (achievementType === "milestone") {
      message = `Amazing! You've reached a new milestone! 🚀`
    }

    const response = NextResponse.json({
      message,
      celebrated: true,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to celebrate achievement" }, { status: 500 })
  }
}
