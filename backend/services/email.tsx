import nodemailer from "nodemailer"

export class EmailService {
  private transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Verify your GreenLoop account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to GreenLoop!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    })
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Reset your GreenLoop password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Password Reset Request</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    })
  }

  async sendWelcomeEmail(user: any) {
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: "Welcome to GreenLoop!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Welcome to GreenLoop, ${user.firstName}!</h2>
          <p>You're now part of our sustainability community. Start logging your eco-friendly actions and make a positive impact!</p>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Get Started
          </a>
        </div>
      `,
    })
  }

  async sendChallengeNotification(user: any, challenge: any) {
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: `New Challenge: ${challenge.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Challenge Available!</h2>
          <h3>${challenge.title}</h3>
          <p>${challenge.description}</p>
          <p><strong>Reward:</strong> ${challenge.reward_points} points</p>
          <a href="${process.env.FRONTEND_URL}/challenges/${challenge.id}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join Challenge
          </a>
        </div>
      `,
    })
  }

  async sendAchievementNotification(user: any, badge: any) {
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: `Achievement Unlocked: ${badge.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">🏆 Achievement Unlocked!</h2>
          <h3>${badge.name}</h3>
          <p>${badge.description}</p>
          <a href="${process.env.FRONTEND_URL}/achievements" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Achievements
          </a>
        </div>
      `,
    })
  }
}
