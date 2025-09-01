import { Router } from 'express'
import { authMiddleware } from '../auth/middleware'
import { TraditionalAuth } from '../auth/strategies/traditional'
import { UserRepository } from '../repositories/UserRepository'
import { EmailService } from '../services/email'
import { UpdateProfileSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../validation/schemas'
import { securityHeaders } from '../middleware/security'

const router = Router()
const auth = new TraditionalAuth()
const userRepo = new UserRepository()
const emailService = new EmailService()

// Get profile
router.get('/profile', authMiddleware(), async (req: any, res) => {
  try {
    const user = await userRepo.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userStats = await userRepo.getUserStats(user.id)

    const response = res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      stats: userStats,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch profile' })
  }
})

// Update profile
router.put('/profile', authMiddleware(), async (req: any, res) => {
  try {
    const validatedData = UpdateProfileSchema.parse(req.body)
    const updatedUser = await userRepo.update(req.user.id, validatedData)

    const response = res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        department: updatedUser.department,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
      },
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update profile' })
  }
})

// Dashboard data
router.get('/dashboard', authMiddleware(), async (req: any, res) => {
  try {
    const userStats = await userRepo.getUserStats(req.user.id)
    
    const response = res.json({
      stats: userStats,
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' })
  }
})

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body)
    
    const user = await userRepo.findByEmail(email)
    if (!user || !user.isActive) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    const resetToken = await auth.generatePasswordResetToken(user.id)
    await emailService.sendPasswordReset(user.email, resetToken)

    const response = res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: 'Password reset request failed' })
  }
})

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const validatedData = ResetPasswordSchema.parse(req.body)
    const userId = await auth.verifyPasswordResetToken(validatedData.token)
    const passwordHash = await auth.hashPassword(validatedData.password)
    await auth.updatePassword(userId, passwordHash)

    const response = res.json({
      message: 'Password reset successfully',
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Password reset failed' })
  }
})

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' })
    }

    const userId = await auth.verifyEmailToken(token)
    await userRepo.update(userId, { emailVerified: true })

    const response = res.json({
      message: 'Email verified successfully',
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Email verification failed' })
  }
})

// Logout
router.post('/logout', authMiddleware(), async (req: any, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await auth.invalidateRefreshToken(refreshToken)
    }

    const response = res.json({
      message: 'Logged out successfully',
    })

    return securityHeaders(response)
  } catch (error: any) {
    return res.status(500).json({ error: 'Logout failed' })
  }
})

export { router }