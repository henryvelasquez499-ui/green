import { Router } from 'express'
import { TraditionalAuth } from '../auth/strategies/traditional'
import { UserRepository } from '../repositories/UserRepository'
import { EmailService } from '../services/email'
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../validation/schemas'
import { securityHeaders } from '../middleware/security'

const router = Router()
const auth = new TraditionalAuth()
const userRepo = new UserRepository()
const emailService = new EmailService()

// Login
router.post('/login', async (req, res) => {
  try {
    const validatedData = LoginSchema.parse(req.body)
    const result = await auth.login(validatedData.email, validatedData.password)
    
    const response = res.json({
      message: 'Login successful',
      ...result
    })
    
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Login failed' })
  }
})

// Register
router.post('/register', async (req, res) => {
  try {
    const validatedData = RegisterSchema.parse(req.body)
    const result = await auth.register(validatedData.email, validatedData.password, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      department: validatedData.department
    })
    
    const response = res.json({
      message: 'User created successfully. Please check your email for verification.',
      userId: result.user.id
    })
    
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Registration failed' })
  }
})

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    const accessToken = await auth.refreshAccessToken(refreshToken)
    
    const response = res.json({ accessToken })
    return securityHeaders(response)
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Token refresh failed' })
  }
})

export { router }