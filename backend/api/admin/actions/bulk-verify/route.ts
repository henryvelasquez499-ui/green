import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../../auth/middleware"
import { ActionRepository } from "../../../../repositories/ActionRepository"
import { BulkVerifyActionsSchema } from "../../../../validation/schemas"
import { securityHeaders } from "../../../../middleware/security"

const actionRepo = new ActionRepository()

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = BulkVerifyActionsSchema.parse(body)

    const adminId = (request as any).user.id

    await actionRepo.bulkVerify(validatedData.actionIds, adminId, validatedData.status, validatedData.notes)

    const response = NextResponse.json({
      message: `${validatedData.actionIds.length} actions ${validatedData.status} successfully`,
      processedCount: validatedData.actionIds.length,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to bulk verify actions" }, { status: 400 })
  }
}
