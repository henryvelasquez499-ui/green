import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const categories = await db.query(
      `SELECT id, name, description, icon, color, points_multiplier
       FROM action_categories 
       WHERE is_active = true
       ORDER BY name`,
      [],
    )

    const response = NextResponse.json({ categories })
    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 })
  }
}
