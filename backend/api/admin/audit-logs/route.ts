import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const adminId = searchParams.get("adminId")
    const action = searchParams.get("action")

    let whereClause = ""
    const params: any[] = []

    if (adminId) {
      whereClause += `${whereClause ? " AND" : " WHERE"} aal.admin_id = $${params.length + 1}`
      params.push(adminId)
    }

    if (action) {
      whereClause += `${whereClause ? " AND" : " WHERE"} aal.action ILIKE $${params.length + 1}`
      params.push(`%${action}%`)
    }

    const auditLogs = await db.query(
      `SELECT 
         aal.*,
         u.first_name,
         u.last_name,
         u.email
       FROM admin_audit_log aal
       JOIN users u ON aal.admin_id = u.id
       ${whereClause}
       ORDER BY aal.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    )

    const response = NextResponse.json({
      auditLogs,
      pagination: {
        limit,
        offset,
        hasMore: auditLogs.length === limit,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch audit logs" }, { status: 500 })
  }
}
