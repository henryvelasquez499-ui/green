import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { DatabaseManager } from "../config/database"
import { EmailService } from "../services/email"

export interface UserData {
  firstName: string
  lastName: string
  email: string
  department?: string
}

export class TraditionalAuth {
  private db = DatabaseManager.getInstance()
  private emailService = new EmailService()

  async register(email: string, password: string, userData: UserData) {
    // Check if user already exists
    const existingUser = await this.db.query("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser.length > 0) {
      throw new Error("User already exists")
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const [user] = await this.db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, department, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'employee', false)
       RETURNING id, email, first_name, last_name, department, role, created_at`,
      [email, passwordHash, userData.firstName, userData.lastName, userData.department],
    )

    // Generate verification token
    const verificationToken = jwt.sign({ userId: user.id, type: "email_verification" }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    })

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken)

    return { user, verificationToken }
  }

  async login(email: string, password: string) {
    // Find user
    const [user] = await this.db.query(
      "SELECT id, email, password_hash, first_name, last_name, role, email_verified, is_active FROM users WHERE email = $1",
      [email],
    )

    if (!user) {
      throw new Error("Invalid credentials")
    }

    if (!user.is_active) {
      throw new Error("Account is deactivated")
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      throw new Error("Invalid credentials")
    }

    if (!user.email_verified) {
      throw new Error("Please verify your email before logging in")
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role)
    const refreshToken = this.generateRefreshToken(user.id)

    // Store session
    await this.db.query(
      "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)], // 7 days
    )

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    }
  }

  generateAccessToken(userId: string, role: string): string {
    return jwt.sign({ userId, role, type: "access" }, process.env.JWT_SECRET!, { expiresIn: "15m" })
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: "refresh" }, process.env.JWT_SECRET!, { expiresIn: "7d" })
  }

  async verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as any
    } catch {
      throw new Error("Invalid token")
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = await this.verifyToken(refreshToken)

    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token")
    }

    // Verify session exists
    const [session] = await this.db.query(
      "SELECT user_id FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()",
      [refreshToken],
    )

    if (!session) {
      throw new Error("Session expired")
    }

    // Get user role
    const [user] = await this.db.query("SELECT role FROM users WHERE id = $1", [payload.userId])

    return this.generateAccessToken(payload.userId, user.role)
  }
}
