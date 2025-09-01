import { DatabaseManager } from "../config/database"

export interface CreateActionData {
  userId: string
  categoryId: string
  title: string
  description?: string
  impactValue?: number
  impactUnit?: string
  actionDate: Date
}

export interface SustainabilityAction {
  id: string
  userId: string
  categoryId: string
  title: string
  description?: string
  impactValue?: number
  impactUnit?: string
  pointsEarned: number
  verificationStatus: "pending" | "verified" | "rejected"
  verificationNotes?: string
  verifiedBy?: string
  verifiedAt?: Date
  actionDate: Date
  createdAt: Date
  updatedAt: Date
}

export class ActionRepository {
  private db = DatabaseManager.getInstance()

  async create(actionData: CreateActionData): Promise<SustainabilityAction> {
    const [action] = await this.db.query(
      `INSERT INTO sustainability_actions (
        user_id, category_id, title, description, impact_value, impact_unit, action_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        actionData.userId,
        actionData.categoryId,
        actionData.title,
        actionData.description,
        actionData.impactValue,
        actionData.impactUnit,
        actionData.actionDate,
      ],
    )

    return this.mapAction(action)
  }

  async findById(id: string): Promise<SustainabilityAction | null> {
    const [action] = await this.db.query("SELECT * FROM sustainability_actions WHERE id = $1", [id])

    return action ? this.mapAction(action) : null
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<SustainabilityAction[]> {
    const actions = await this.db.query(
      `SELECT sa.*, ac.name as category_name, ac.color as category_color
       FROM sustainability_actions sa
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.user_id = $1
       ORDER BY sa.action_date DESC, sa.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    )

    return actions.map(this.mapAction)
  }

  async findPendingVerification(limit = 100, offset = 0): Promise<SustainabilityAction[]> {
    const actions = await this.db.query(
      `SELECT sa.*, u.first_name, u.last_name, u.email, ac.name as category_name
       FROM sustainability_actions sa
       JOIN users u ON sa.user_id = u.id
       JOIN action_categories ac ON sa.category_id = ac.id
       WHERE sa.verification_status = 'pending'
       ORDER BY sa.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )

    return actions.map(this.mapAction)
  }

  async update(id: string, updates: Partial<SustainabilityAction>): Promise<SustainabilityAction> {
    const setClause = []
    const values = []
    let paramIndex = 1

    if (updates.title !== undefined) {
      setClause.push(`title = $${paramIndex++}`)
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      setClause.push(`description = $${paramIndex++}`)
      values.push(updates.description)
    }
    if (updates.impactValue !== undefined) {
      setClause.push(`impact_value = $${paramIndex++}`)
      values.push(updates.impactValue)
    }
    if (updates.impactUnit !== undefined) {
      setClause.push(`impact_unit = $${paramIndex++}`)
      values.push(updates.impactUnit)
    }
    if (updates.pointsEarned !== undefined) {
      setClause.push(`points_earned = $${paramIndex++}`)
      values.push(updates.pointsEarned)
    }
    if (updates.verificationStatus !== undefined) {
      setClause.push(`verification_status = $${paramIndex++}`)
      values.push(updates.verificationStatus)
    }
    if (updates.verificationNotes !== undefined) {
      setClause.push(`verification_notes = $${paramIndex++}`)
      values.push(updates.verificationNotes)
    }
    if (updates.verifiedBy !== undefined) {
      setClause.push(`verified_by = $${paramIndex++}`)
      values.push(updates.verifiedBy)
    }
    if (updates.verifiedAt !== undefined) {
      setClause.push(`verified_at = $${paramIndex++}`)
      values.push(updates.verifiedAt)
    }

    setClause.push(`updated_at = NOW()`)
    values.push(id)

    const [action] = await this.db.query(
      `UPDATE sustainability_actions SET ${setClause.join(", ")} WHERE id = $${paramIndex}
       RETURNING *`,
      values,
    )

    return this.mapAction(action)
  }

  async delete(id: string): Promise<void> {
    await this.db.query("DELETE FROM sustainability_actions WHERE id = $1", [id])
  }

  async getActionsByCategory(categoryId: string, limit = 100): Promise<SustainabilityAction[]> {
    const actions = await this.db.query(
      `SELECT sa.*, u.first_name, u.last_name
       FROM sustainability_actions sa
       JOIN users u ON sa.user_id = u.id
       WHERE sa.category_id = $1 AND sa.verification_status = 'verified'
       ORDER BY sa.action_date DESC
       LIMIT $2`,
      [categoryId, limit],
    )

    return actions.map(this.mapAction)
  }

  async getUserActionCount(userId: string): Promise<number> {
    const [result] = await this.db.query("SELECT COUNT(*) as count FROM sustainability_actions WHERE user_id = $1", [
      userId,
    ])

    return Number.parseInt(result.count)
  }

  async bulkVerify(
    actionIds: string[],
    verifiedBy: string,
    status: "verified" | "rejected",
    notes?: string,
  ): Promise<void> {
    await this.db.query(
      `UPDATE sustainability_actions 
       SET verification_status = $1, verified_by = $2, verified_at = NOW(), verification_notes = $3, updated_at = NOW()
       WHERE id = ANY($4)`,
      [status, verifiedBy, notes, actionIds],
    )
  }

  private mapAction(row: any): SustainabilityAction {
    return {
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      title: row.title,
      description: row.description,
      impactValue: row.impact_value,
      impactUnit: row.impact_unit,
      pointsEarned: row.points_earned || 0,
      verificationStatus: row.verification_status,
      verificationNotes: row.verification_notes,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
      actionDate: row.action_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
