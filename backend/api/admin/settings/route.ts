import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../auth/middleware"
import { DatabaseManager } from "../../../config/database"
import { SystemSettingsSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const db = DatabaseManager.getInstance()

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const settings = await db.query("SELECT * FROM system_settings ORDER BY key", [])

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        dataType: setting.data_type,
        isPublic: setting.is_public,
        updatedAt: setting.updated_at,
      }
      return acc
    }, {})

    const response = NextResponse.json({ settings: settingsMap })
    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = SystemSettingsSchema.parse(body)

    const adminId = (request as any).user.id

    // Update multiple settings
    for (const [key, value] of Object.entries(validatedData.settings)) {
      await db.query(
        `INSERT INTO system_settings (key, value, updated_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (key)
         DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
        [key, value, adminId],
      )
    }

    const response = NextResponse.json({
      message: "Settings updated successfully",
      updatedCount: Object.keys(validatedData.settings).length,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 400 })
  }
}
