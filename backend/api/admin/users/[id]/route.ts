import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../../auth/middleware"
import { UserRepository } from "../../../../repositories/UserRepository"
import { UpdateUserSchema } from "../../../../validation/schemas"
import { securityHeaders } from "../../../../middleware/security"

const userRepo = new UserRepository()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = UpdateUserSchema.parse(body)

    const user = await userRepo.findById(params.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await userRepo.update(params.id, validatedData)

    const response = NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const user = await userRepo.findById(params.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Soft delete by deactivating
    await userRepo.update(params.id, { isActive: false })

    const response = NextResponse.json({
      message: "User deactivated successfully",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to deactivate user" }, { status: 500 })
  }
}
