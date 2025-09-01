import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { TrackEventSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = TrackEventSchema.parse(body)

    const userId = (request as any).user.id

    // Get client info
    const userAgent = request.headers.get("user-agent") || ""
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Store analytics event
    await db.query(
      "INSERT INTO user_analytics (user_id, event_type, event_data, session_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        userId,
        validatedData.eventType,
        JSON.stringify(validatedData.eventData || {}),
        validatedData.sessionId,
        ipAddress,
        userAgent,
      ],
    )

    const response = NextResponse.json({
      message: "Event tracked successfully",
      eventType: validatedData.eventType,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to track event" }, { status: 400 })
  }
}
