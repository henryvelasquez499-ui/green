import rateLimit from "express-rate-limit"
import { type NextRequest, NextResponse } from "next/server"

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs (for auth endpoints)
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
})

export const apiKeyValidation = (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key")
  const validApiKey = process.env.ADMIN_API_KEY

  if (!apiKey || apiKey !== validApiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  return null
}

export const corsConfig = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}

export const securityHeaders = (response: NextResponse) => {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  return response
}

export const validateContentType = (req: NextRequest, expectedType = "application/json") => {
  const contentType = req.headers.get("content-type")

  if (!contentType || !contentType.includes(expectedType)) {
    return NextResponse.json({ error: `Expected content-type: ${expectedType}` }, { status: 400 })
  }

  return null
}
