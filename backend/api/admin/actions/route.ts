import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../auth/middleware"
import { ActionRepository } from "../../../repositories/ActionRepository"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const actionRepo = new ActionRepository()
const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let whereClause = ""
    const params: any[] = []

    if (status === "pending") {
      whereClause = "WHERE sa.verification_status = 'pending'"
    } else if (status === "verified") {
      whereClause = "WHERE sa.verification_status = 'verified'"
    } else if (status === "rejected") {
      whereClause = "WHERE sa.verification_status = 'rejected'"
    }

    const actions = await db.query(
      `SELECT 
         sa.*,
         u.first_name,
         u.last_name,
         u.email,
         ac.name as category_name,
         ac.color as category_color
       FROM sustainability_actions sa
       JOIN users u ON sa.user_id = u.id
       JOIN action_categories ac ON sa.category_id = ac.id
       ${whereClause}
       ORDER BY sa.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )

    const response = NextResponse.json({
      actions,
      pagination: {
        limit,
        offset,
        hasMore: actions.length === limit,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch actions" }, { status: 500 })
  }
}
