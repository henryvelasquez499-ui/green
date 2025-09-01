import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../../../auth/middleware"
import { ActionRepository } from "../../../../../repositories/ActionRepository"
import { VerifyActionSchema } from "../../../../../validation/schemas"
import { securityHeaders } from "../../../../../middleware/security"

const actionRepo = new ActionRepository()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = VerifyActionSchema.parse(body)

    const adminId = (request as any).user.id

    const updatedAction = await actionRepo.update(params.id, {
      verificationStatus: validatedData.status,
      verificationNotes: validatedData.notes,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    })

    const response = NextResponse.json({
      message: `Action ${validatedData.status} successfully`,
      action: updatedAction,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to verify action" }, { status: 400 })
  }
}
