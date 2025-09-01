import { type NextRequest, NextResponse } from "next/server"
import { TraditionalAuth } from "./strategies/traditional"
import { DatabaseManager } from "../config/database"

export type UserRole = "employee" | "admin" | "sustainability_manager"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

const auth = new TraditionalAuth()
const db = DatabaseManager.getInstance()

export const authMiddleware = (requiredRole?: UserRole) => {
  return async (req: AuthenticatedRequest) => {
    try {
      const authHeader = req.headers.get("authorization")
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "No token provided" }, { status: 401 })
      }

      const token = authHeader.substring(7)
      const payload = await auth.verifyToken(token)

      if (payload.type !== "access") {
        return NextResponse.json({ error: "Invalid token type" }, { status: 401 })
      }

      // Get user details
      const [user] = await db.query("SELECT id, email, role, is_active FROM users WHERE id = $1", [payload.userId])

      if (!user || !user.is_active) {
        return NextResponse.json({ error: "User not found or inactive" }, { status: 401 })
      }

      // Check role requirement
      if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      }

      return null // Continue to next middleware/handler
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  }
}

export const requireAdmin = async (req: AuthenticatedRequest) => {
  const authResult = await authMiddleware("admin")(req)
  if (authResult) return authResult

  // Log admin action for audit trail
  await db.query("INSERT INTO admin_audit_log (admin_id, action, target_type, ip_address) VALUES ($1, $2, $3, $4)", [
    req.user!.id,
    `${req.method} ${req.url}`,
    "api",
    req.ip,
  ])

  return null
}
