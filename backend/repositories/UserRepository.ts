import { DatabaseManager } from "../config/database"

export interface CreateUserData {
  email: string
  passwordHash?: string
  firstName: string
  lastName: string
  department?: string
  role?: "employee" | "admin" | "sustainability_manager"
  microsoftId?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  department?: string
  role: string
  microsoftId?: string
  avatarUrl?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export class UserRepository {
  private db = DatabaseManager.getInstance()

  async create(userData: CreateUserData): Promise<User> {
    const [user] = await this.db.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, department, role, microsoft_id, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, department, role, microsoft_id, avatar_url, is_active, email_verified, created_at, updated_at`,
      [
        userData.email,
        userData.passwordHash,
        userData.firstName,
        userData.lastName,
        userData.department,
        userData.role || "employee",
        userData.microsoftId,
        userData.microsoftId ? true : false, // Auto-verify Microsoft users
      ],
    )

    return this.mapUser(user)
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.query(
      "SELECT id, email, first_name, last_name, department, role, microsoft_id, avatar_url, is_active, email_verified, created_at, updated_at FROM users WHERE id = $1",
      [id],
    )

    return user ? this.mapUser(user) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db.query(
      "SELECT id, email, first_name, last_name, department, role, microsoft_id, avatar_url, is_active, email_verified, created_at, updated_at FROM users WHERE email = $1",
      [email],
    )

    return user ? this.mapUser(user) : null
  }

  async findByMicrosoftId(microsoftId: string): Promise<User | null> {
    const [user] = await this.db.query(
      "SELECT id, email, first_name, last_name, department, role, microsoft_id, avatar_url, is_active, email_verified, created_at, updated_at FROM users WHERE microsoft_id = $1",
      [microsoftId],
    )

    return user ? this.mapUser(user) : null
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const setClause = []
    const values = []
    let paramIndex = 1

    if (updates.firstName !== undefined) {
      setClause.push(`first_name = $${paramIndex++}`)
      values.push(updates.firstName)
    }
    if (updates.lastName !== undefined) {
      setClause.push(`last_name = $${paramIndex++}`)
      values.push(updates.lastName)
    }
    if (updates.department !== undefined) {
      setClause.push(`department = $${paramIndex++}`)
      values.push(updates.department)
    }
    if (updates.role !== undefined) {
      setClause.push(`role = $${paramIndex++}`)
      values.push(updates.role)
    }
    if (updates.avatarUrl !== undefined) {
      setClause.push(`avatar_url = $${paramIndex++}`)
      values.push(updates.avatarUrl)
    }
    if (updates.isActive !== undefined) {
      setClause.push(`is_active = $${paramIndex++}`)
      values.push(updates.isActive)
    }
    if (updates.emailVerified !== undefined) {
      setClause.push(`email_verified = $${paramIndex++}`)
      values.push(updates.emailVerified)
    }

    setClause.push(`updated_at = NOW()`)
    values.push(id)

    const [user] = await this.db.query(
      `UPDATE users SET ${setClause.join(", ")} WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, department, role, microsoft_id, avatar_url, is_active, email_verified, created_at, updated_at`,
      values,
    )

    return this.mapUser(user)
  }

  async delete(id: string): Promise<void> {
    await this.db.query("UPDATE users SET is_active = false WHERE id = $1", [id])
  }

  async getAllUsers(limit = 100, offset = 0): Promise<User[]> {
    const users = await this.db.query(
      `SELECT id, email, first_name, last_name, department, role, microsoft_id, avatar_url, is_active, email_verified, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )

    return users.map(this.mapUser)
  }

  async getUserStats(userId: string): Promise<any> {
    const [stats] = await this.db.query(
      `SELECT 
        up.total_points,
        up.monthly_points,
        up.weekly_points,
        up.current_streak,
        up.longest_streak,
        (SELECT COUNT(*) FROM sustainability_actions WHERE user_id = $1) as total_actions,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = $1) as total_badges
       FROM user_points up
       WHERE up.user_id = $1`,
      [userId],
    )

    return (
      stats || {
        total_points: 0,
        monthly_points: 0,
        weekly_points: 0,
        current_streak: 0,
        longest_streak: 0,
        total_actions: 0,
        total_badges: 0,
      }
    )
  }

  private mapUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      department: row.department,
      role: row.role,
      microsoftId: row.microsoft_id,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
