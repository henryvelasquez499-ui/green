import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { ActionRepository } from "../../../repositories/ActionRepository"
import { securityHeaders } from "../../../middleware/security"

const actionRepo = new ActionRepository()

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const userId = (request as any).user.id

    // Get all user actions (with optional date filtering)
    const actions = await actionRepo.findByUserId(userId, 1000, 0)

    let filteredActions = actions
    if (startDate || endDate) {
      filteredActions = actions.filter((action) => {
        const actionDate = new Date(action.actionDate)
        if (startDate && actionDate < new Date(startDate)) return false
        if (endDate && actionDate > new Date(endDate)) return false
        return true
      })
    }

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = "Date,Title,Category,Impact Value,Impact Unit,Points Earned,Status\n"
      const csvRows = filteredActions
        .map(
          (action) =>
            `${action.actionDate},${action.title},"${action.categoryId}",${action.impactValue || ""},${action.impactUnit || ""},${action.pointsEarned},${action.verificationStatus}`,
        )
        .join("\n")

      const response = new NextResponse(csvHeaders + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=sustainability-actions.csv",
        },
      })

      return securityHeaders(response)
    }

    // Default JSON format
    const response = NextResponse.json({
      actions: filteredActions,
      summary: {
        totalActions: filteredActions.length,
        totalPoints: filteredActions.reduce((sum, action) => sum + action.pointsEarned, 0),
        totalImpact: filteredActions.reduce((sum, action) => sum + (action.impactValue || 0), 0),
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export actions" }, { status: 500 })
  }
}
