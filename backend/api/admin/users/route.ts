import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "../../../auth/middleware"
import { UserRepository } from "../../../repositories/UserRepository"
import { CreateUserSchema } from "../../../validation/schemas"
import { TraditionalAuth } from "../../../auth/strategies/traditional"
import { securityHeaders } from "../../../middleware/security"

const userRepo = new UserRepository()
const auth = new TraditionalAuth()

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    let users = await userRepo.getAllUsers(limit, offset)

    // Apply filters
    if (role) {
      users = users.filter((user) => user.role === role)
    }
    if (status === "active") {
      users = users.filter((user) => user.isActive)
    } else if (status === "inactive") {
      users = users.filter((user) => !user.isActive)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower),
      )
    }

    // Get user stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await userRepo.getUserStats(user.id)
        return { ...user, stats }
      }),
    )

    const response = NextResponse.json({
      users: usersWithStats,
      pagination: {
        limit,
        offset,
        total: users.length,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request as any)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const validatedData = CreateUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password if provided
    let passwordHash: string | undefined
    if (validatedData.password) {
      passwordHash = await auth.hashPassword(validatedData.password)
    }

    // Create user
    const user = await userRepo.create({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      department: validatedData.department,
      role: validatedData.role || "employee",
    })

    const response = NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 400 })
  }
}
