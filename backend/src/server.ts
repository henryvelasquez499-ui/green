import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { DatabaseManager } from './config/database'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Security middleware
app.use(helmet())
app.use(compression())
app.use(morgan('combined'))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await DatabaseManager.getInstance().healthCheck()
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth ? 'connected' : 'disconnected'
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    })
  }
})

// API Routes - Import all route handlers
import { router as authRoutes } from './routes/auth'
import { router as userRoutes } from './routes/users'
import { router as actionRoutes } from './routes/actions'
import { router as challengeRoutes } from './routes/challenges'
import { router as teamRoutes } from './routes/teams'
import { router as gamificationRoutes } from './routes/gamification'
import { router as analyticsRoutes } from './routes/analytics'
import { router as adminRoutes } from './routes/admin'

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/actions', actionRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/admin', adminRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GreenLoop Backend running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})

export default app