import { DatabaseManager } from "../config/database"
import { EmailService } from "./email"

export interface Badge {
  id: string
  name: string
  description: string
  iconUrl: string
  criteriaType: string
  criteriaValue: number
  categoryId?: string
  rarity: string
}

export interface BadgeData {
  name: string
  description: string
  iconUrl: string
  criteriaType: string
  criteriaValue: number
  categoryId?: string
  rarity: string
}

export class BadgeService {
  private db = DatabaseManager.getInstance()
  private emailService = new EmailService()

  async checkBadgeEligibility(userId: string): Promise<Badge[]> {
    // Get all badges user hasn't earned yet
    const availableBadges = await this.db.query(
      `SELECT b.* FROM badges b
       WHERE b.is_active = true
       AND b.id NOT IN (
         SELECT badge_id FROM user_badges WHERE user_id = $1
       )`,
      [userId],
    )

    const eligibleBadges: Badge[] = []

    for (const badge of availableBadges) {
      const isEligible = await this.checkBadgeCriteria(userId, badge)
      if (isEligible) {
        eligibleBadges.push(badge)
      }
    }

    return eligibleBadges
  }

  private async checkBadgeCriteria(userId: string, badge: Badge): Promise<boolean> {
    switch (badge.criteriaType) {
      case "action_count":
        const [actionCount] = await this.db.query(
          badge.categoryId
            ? "SELECT COUNT(*) as count FROM sustainability_actions WHERE user_id = $1 AND category_id = $2"
            : "SELECT COUNT(*) as count FROM sustainability_actions WHERE user_id = $1",
          badge.categoryId ? [userId, badge.categoryId] : [userId],
        )
        return Number.parseInt(actionCount.count) >= badge.criteriaValue

      case "points_total":
        const [userPoints] = await this.db.query("SELECT total_points FROM user_points WHERE user_id = $1", [userId])
        return (userPoints?.total_points || 0) >= badge.criteriaValue

      case "streak_days":
        const [streakData] = await this.db.query("SELECT current_streak FROM user_points WHERE user_id = $1", [userId])
        return (streakData?.current_streak || 0) >= badge.criteriaValue

      case "category_master":
        if (!badge.categoryId) return false
        const [categoryActions] = await this.db.query(
          "SELECT COUNT(*) as count FROM sustainability_actions WHERE user_id = $1 AND category_id = $2",
          [userId, badge.categoryId],
        )
        return Number.parseInt(categoryActions.count) >= badge.criteriaValue

      default:
        return false
    }
  }

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Check if user already has this badge
      const [existingBadge] = await client.query("SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2", [
        userId,
        badgeId,
      ])

      if (existingBadge) {
        return // Already has badge
      }

      // Award badge
      await client.query("INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)", [userId, badgeId])

      // Get badge and user details for notification
      const [badge] = await client.query("SELECT name, description FROM badges WHERE id = $1", [badgeId])

      const [user] = await client.query("SELECT email, first_name FROM users WHERE id = $1", [userId])

      // Send achievement notification
      if (badge && user) {
        await this.emailService.sendAchievementNotification(user, badge)
      }
    })
  }

  async createCustomBadge(badgeData: BadgeData): Promise<Badge> {
    const [badge] = await this.db.query(
      `INSERT INTO badges (name, description, icon_url, criteria_type, criteria_value, category_id, rarity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        badgeData.name,
        badgeData.description,
        badgeData.iconUrl,
        badgeData.criteriaType,
        badgeData.criteriaValue,
        badgeData.categoryId,
        badgeData.rarity,
      ],
    )

    return badge
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    const badges = await this.db.query(
      `SELECT b.*, ub.earned_at
       FROM badges b
       JOIN user_badges ub ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [userId],
    )

    return badges
  }

  async processAutomaticBadgeAwards(userId: string): Promise<void> {
    const eligibleBadges = await this.checkBadgeEligibility(userId)

    for (const badge of eligibleBadges) {
      await this.awardBadge(userId, badge.id)
    }
  }
}
