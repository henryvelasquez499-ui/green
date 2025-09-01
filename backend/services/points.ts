import { DatabaseManager } from "../config/database"

export interface SustainabilityAction {
  id: string
  userId: string
  categoryId: string
  impactValue?: number
  actionDate: Date
}

export interface LeaderboardEntry {
  userId: string
  firstName: string
  lastName: string
  totalPoints: number
  rank: number
}

export class PointsCalculator {
  private db = DatabaseManager.getInstance()

  async calculateActionPoints(action: SustainabilityAction): Promise<number> {
    // Get category multiplier
    const [category] = await this.db.query("SELECT points_multiplier FROM action_categories WHERE id = $1", [
      action.categoryId,
    ])

    const basePoints = 10 // Base points per action
    const categoryMultiplier = category?.points_multiplier || 1.0

    // Impact value bonus (if provided)
    const impactBonus = action.impactValue ? Math.min(action.impactValue * 2, 50) : 0

    // Streak bonus
    const streakBonus = await this.calculateStreakBonus(action.userId)

    // Challenge multiplier
    const challengeMultiplier = await this.getChallengeMultiplier(action.userId)

    const totalPoints = Math.round(
      (basePoints + impactBonus) * categoryMultiplier * (1 + streakBonus) * challengeMultiplier,
    )

    return Math.max(totalPoints, 1) // Minimum 1 point
  }

  private async calculateStreakBonus(userId: string): Promise<number> {
    const [userPoints] = await this.db.query("SELECT current_streak FROM user_points WHERE user_id = $1", [userId])

    const streak = userPoints?.current_streak || 0

    // Bonus increases with streak: 5% per day up to 50%
    return Math.min(streak * 0.05, 0.5)
  }

  private async getChallengeMultiplier(userId: string): Promise<number> {
    const activeChallenges = await this.db.query(
      `SELECT COUNT(*) as count FROM challenge_participants cp
       JOIN challenges c ON cp.challenge_id = c.id
       WHERE cp.user_id = $1 AND c.is_active = true AND c.end_date > NOW()`,
      [userId],
    )

    const challengeCount = Number.parseInt(activeChallenges[0]?.count || "0")

    // 10% bonus per active challenge, max 30%
    return 1 + Math.min(challengeCount * 0.1, 0.3)
  }

  async updateUserPoints(userId: string, points: number, actionId?: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Update user points
      await client.query(
        `INSERT INTO user_points (user_id, total_points, monthly_points, weekly_points)
         VALUES ($1, $2, $2, $2)
         ON CONFLICT (user_id) 
         UPDATE SET 
           total_points = user_points.total_points + $2,
           monthly_points = user_points.monthly_points + $2,
           weekly_points = user_points.weekly_points + $2,
           updated_at = NOW()`,
        [userId, points],
      )

      // Record transaction
      await client.query(
        "INSERT INTO point_transactions (user_id, action_id, points, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
        [userId, actionId, points, "earned", "Points earned from sustainability action"],
      )

      // Update streak
      await this.updateStreak(client, userId)
    })
  }

  private async updateStreak(client: any, userId: string): Promise<void> {
    const [lastAction] = await client.query(
      "SELECT MAX(action_date) as last_date FROM sustainability_actions WHERE user_id = $1",
      [userId],
    )

    const [userPoints] = await client.query(
      "SELECT current_streak, longest_streak, last_action_date FROM user_points WHERE user_id = $1",
      [userId],
    )

    if (!lastAction?.last_date || !userPoints) return

    const today = new Date()
    const lastActionDate = new Date(lastAction.last_date)
    const daysDiff = Math.floor((today.getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24))

    let newStreak = userPoints.current_streak

    if (daysDiff === 0) {
      // Same day, no change
      return
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      newStreak += 1
    } else {
      // Streak broken, reset to 1
      newStreak = 1
    }

    const longestStreak = Math.max(newStreak, userPoints.longest_streak)

    await client.query(
      "UPDATE user_points SET current_streak = $1, longest_streak = $2, last_action_date = $3 WHERE user_id = $4",
      [newStreak, longestStreak, lastActionDate, userId],
    )
  }

  async calculateLeaderboard(timeframe: "weekly" | "monthly" | "all" = "all"): Promise<LeaderboardEntry[]> {
    const pointsColumn =
      timeframe === "weekly" ? "weekly_points" : timeframe === "monthly" ? "monthly_points" : "total_points"

    const leaderboard = await this.db.query(
      `SELECT 
         u.id as user_id,
         u.first_name,
         u.last_name,
         up.${pointsColumn} as total_points,
         ROW_NUMBER() OVER (ORDER BY up.${pointsColumn} DESC) as rank
       FROM users u
       JOIN user_points up ON u.id = up.user_id
       WHERE u.is_active = true
       ORDER BY up.${pointsColumn} DESC
       LIMIT 100`,
      [],
    )

    return leaderboard
  }
}
