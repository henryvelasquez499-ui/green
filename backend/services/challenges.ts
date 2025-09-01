import { DatabaseManager } from "../config/database"
import { EmailService } from "./email"

export interface Challenge {
  id: string
  title: string
  description: string
  challengeType: string
  targetMetric: string
  targetValue: number
  startDate: Date
  endDate: Date
  rewardPoints: number
  rewardDescription?: string
  isActive: boolean
  createdBy: string
}

export interface ChallengeData {
  title: string
  description: string
  challengeType: "individual" | "team" | "department" | "company_wide"
  targetMetric: "actions_count" | "points_total" | "impact_value"
  targetValue: number
  startDate: Date
  endDate: Date
  rewardPoints: number
  rewardDescription?: string
}

export class ChallengeService {
  private db = DatabaseManager.getInstance()
  private emailService = new EmailService()

  async createChallenge(challengeData: ChallengeData, createdBy: string): Promise<Challenge> {
    const [challenge] = await this.db.query(
      `INSERT INTO challenges (
        title, description, challenge_type, target_metric, target_value,
        start_date, end_date, reward_points, reward_description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        challengeData.title,
        challengeData.description,
        challengeData.challengeType,
        challengeData.targetMetric,
        challengeData.targetValue,
        challengeData.startDate,
        challengeData.endDate,
        challengeData.rewardPoints,
        challengeData.rewardDescription,
        createdBy,
      ],
    )

    // Notify eligible users about new challenge
    await this.notifyUsersAboutChallenge(challenge)

    return challenge
  }

  async joinChallenge(userId: string, challengeId: string): Promise<void> {
    // Check if challenge exists and is active
    const [challenge] = await this.db.query(
      "SELECT * FROM challenges WHERE id = $1 AND is_active = true AND start_date <= NOW() AND end_date > NOW()",
      [challengeId],
    )

    if (!challenge) {
      throw new Error("Challenge not found or not active")
    }

    // Check if user already joined
    const [existing] = await this.db.query(
      "SELECT id FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
      [challengeId, userId],
    )

    if (existing) {
      throw new Error("Already joined this challenge")
    }

    // Join challenge
    await this.db.query("INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2)", [
      challengeId,
      userId,
    ])
  }

  async updateProgress(userId: string, challengeId: string): Promise<void> {
    const [challenge] = await this.db.query("SELECT target_metric FROM challenges WHERE id = $1", [challengeId])

    if (!challenge) return

    let progress = 0

    switch (challenge.target_metric) {
      case "actions_count":
        const [actionCount] = await this.db.query(
          `SELECT COUNT(*) as count FROM sustainability_actions 
           WHERE user_id = $1 AND created_at >= (
             SELECT start_date FROM challenges WHERE id = $2
           )`,
          [userId, challengeId],
        )
        progress = Number.parseInt(actionCount.count)
        break

      case "points_total":
        const [pointsData] = await this.db.query(
          `SELECT SUM(points) as total FROM point_transactions 
           WHERE user_id = $1 AND created_at >= (
             SELECT start_date FROM challenges WHERE id = $2
           )`,
          [userId, challengeId],
        )
        progress = Number.parseInt(pointsData.total || "0")
        break

      case "impact_value":
        const [impactData] = await this.db.query(
          `SELECT SUM(impact_value) as total FROM sustainability_actions 
           WHERE user_id = $1 AND impact_unit = 'kg_co2' AND created_at >= (
             SELECT start_date FROM challenges WHERE id = $2
           )`,
          [userId, challengeId],
        )
        progress = Number.parseFloat(impactData.total || "0")
        break
    }

    // Update progress
    await this.db.query(
      `UPDATE challenge_participants 
       SET current_progress = $1, completed = (current_progress >= (
         SELECT target_value FROM challenges WHERE id = $2
       ))
       WHERE user_id = $3 AND challenge_id = $2`,
      [progress, challengeId, userId],
    )

    // Check if challenge is completed
    await this.checkChallengeCompletion(challengeId)
  }

  async checkChallengeCompletion(challengeId: string): Promise<void> {
    const completedParticipants = await this.db.query(
      `SELECT cp.user_id, u.email, u.first_name, c.reward_points
       FROM challenge_participants cp
       JOIN users u ON cp.user_id = u.id
       JOIN challenges c ON cp.challenge_id = c.id
       WHERE cp.challenge_id = $1 AND cp.completed = true AND cp.completed_at IS NULL`,
      [challengeId],
    )

    for (const participant of completedParticipants) {
      await this.db.transaction(async (client) => {
        // Mark as completed
        await client.query(
          "UPDATE challenge_participants SET completed_at = NOW() WHERE user_id = $1 AND challenge_id = $2",
          [participant.user_id, challengeId],
        )

        // Award points
        if (participant.reward_points > 0) {
          await client.query(
            "INSERT INTO point_transactions (user_id, points, transaction_type, description) VALUES ($1, $2, $3, $4)",
            [participant.user_id, participant.reward_points, "bonus", "Challenge completion reward"],
          )

          await client.query(
            `UPDATE user_points 
             SET total_points = total_points + $1, monthly_points = monthly_points + $1, weekly_points = weekly_points + $1
             WHERE user_id = $2`,
            [participant.reward_points, participant.user_id],
          )
        }
      })
    }
  }

  async distributeRewards(challengeId: string): Promise<void> {
    const [challenge] = await this.db.query("SELECT * FROM challenges WHERE id = $1 AND end_date <= NOW()", [
      challengeId,
    ])

    if (!challenge) return

    // Get top performers based on challenge type
    const winners = await this.db.query(
      `SELECT cp.user_id, u.email, u.first_name, cp.current_progress
       FROM challenge_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.challenge_id = $1
       ORDER BY cp.current_progress DESC
       LIMIT 10`,
      [challengeId],
    )

    // Award bonus points to top 3
    const bonusPoints = [100, 50, 25] // 1st, 2nd, 3rd place bonuses

    for (let i = 0; i < Math.min(winners.length, 3); i++) {
      const winner = winners[i]
      const bonus = bonusPoints[i]

      await this.db.transaction(async (client) => {
        await client.query(
          "INSERT INTO point_transactions (user_id, points, transaction_type, description) VALUES ($1, $2, $3, $4)",
          [
            winner.user_id,
            bonus,
            "bonus",
            `Challenge ranking bonus (${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : "rd"} place)`,
          ],
        )

        await client.query(
          `UPDATE user_points 
           SET total_points = total_points + $1, monthly_points = monthly_points + $1, weekly_points = weekly_points + $1
           WHERE user_id = $2`,
          [bonus, winner.user_id],
        )
      })
    }
  }

  private async notifyUsersAboutChallenge(challenge: Challenge): Promise<void> {
    let users: any[] = []

    switch (challenge.challengeType) {
      case "company_wide":
        users = await this.db.query("SELECT email, first_name FROM users WHERE is_active = true")
        break
      case "department":
        // For now, notify all users - could be filtered by department
        users = await this.db.query("SELECT email, first_name FROM users WHERE is_active = true")
        break
      default:
        // Individual and team challenges don't auto-notify
        return
    }

    for (const user of users) {
      await this.emailService.sendChallengeNotification(user, challenge)
    }
  }
}
