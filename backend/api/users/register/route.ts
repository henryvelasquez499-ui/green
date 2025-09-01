import { type NextRequest, NextResponse } from "next/server"
import { TraditionalAuth } from "../../../auth/strategies/traditional"
import { UserRepository } from "../../../repositories/UserRepository"
import { EmailService } from "../../../services/email"
import { CreateUserSchema } from "../../../validation/schemas"
import { securityHeaders } from "../../../middleware/security"

const auth = new TraditionalAuth()
const userRepo = new UserRepository()
const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = CreateUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await auth.hashPassword(validatedData.password)

    // Create user
    const user = await userRepo.create({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      department: validatedData.department,
    })

    // Send verification email
    const verificationToken = await auth.generateVerificationToken(user.id)
    await emailService.sendVerificationEmail(user.email, verificationToken)

    // Send welcome email
    await emailService.sendWelcomeEmail(user)

    const response = NextResponse.json({
      message: "User created successfully. Please check your email for verification.",
      userId: user.id,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 400 })
  }
}
