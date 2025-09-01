import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "../../../auth/middleware"
import { ActionRepository } from "../../../repositories/ActionRepository"
import { UpdateActionSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const actionRepo = new ActionRepository()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const action = await actionRepo.findById(params.id)
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 })
    }

    // Check if user owns this action or is admin
    const user = (request as any).user
    if (action.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const response = NextResponse.json({ action })
    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch action" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const action = await actionRepo.findById(params.id)
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 })
    }

    // Check if user owns this action
    const user = (request as any).user
    if (action.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Only allow editing if action is pending or rejected
    if (action.verificationStatus === "verified") {
      return NextResponse.json({ error: "Cannot edit verified actions" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = UpdateActionSchema.parse(body)

    const updatedAction = await actionRepo.update(params.id, {
      ...validatedData,
      verificationStatus: "pending", // Reset to pending after edit
    })

    const response = NextResponse.json({
      message: "Action updated successfully",
      action: updatedAction,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update action" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware()(request as any)
  if (authResult) return authResult

  try {
    const action = await actionRepo.findById(params.id)
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 })
    }

    // Check if user owns this action or is admin
    const user = (request as any).user
    if (action.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    await actionRepo.delete(params.id)

    const response = NextResponse.json({
      message: "Action deleted successfully",
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete action" }, { status: 500 })
  }
}
