import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import portfolioRoutes from './routes/portfolio.js'
import { authenticateToken } from './middleware/auth.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file
// Load .env from the portfolio root directory (one level up from server/)
dotenv.config({ path: join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// For Vercel serverless, use /tmp for file storage (ephemeral)
// For local/production, use the data directory
const isVercel = process.env.VERCEL === '1'
const DATA_BASE_DIR = isVercel ? '/tmp' : __dirname

// Ensure knowledge directory exists
const KNOWLEDGE_DIR = join(DATA_BASE_DIR, 'data/knowledge')
if (!existsSync(KNOWLEDGE_DIR)) {
  mkdirSync(KNOWLEDGE_DIR, { recursive: true })
}


// Middleware
// CORS configuration - restrict to specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'] // Default dev origins

app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (!origin) {
        return callback(null, true)
      }
      // Allow localhost with any port in development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true)
      }
      // Also allow explicitly listed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
    }
    // In production, only allow explicitly listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Security headers middleware
app.use((req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By')
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Only set Strict-Transport-Security in production with HTTPS
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  next()
})

// Rate limiting configurations
const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: { error: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
})

// Rate limiter for authentication endpoints (login, refresh)
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many authentication requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiter for portfolio updates and file uploads
const updateRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many update requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiter for file uploads (more restrictive)
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many file upload requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// If behind a reverse proxy (e.g., nginx, load balancer), uncomment the line below
// app.set('trust proxy', 1)

// Handle OPTIONS preflight requests before rate limiting
app.options('*', cors())

// Routes
// Apply rate limiting to critical endpoints (skip OPTIONS requests)
app.use('/api/auth/request-otp', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next()
  }
  otpRateLimiter(req, res, next)
})
app.use('/api/auth/login', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next()
  }
  authRateLimiter(req, res, next)
})
app.use('/api/auth/refresh', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next()
  }
  authRateLimiter(req, res, next)
})
app.use('/api/auth', authRoutes)
app.use('/api/portfolio', portfolioRoutes)

// Health check endpoints
// Public health check (for regular operations)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'portfolio-api',
    timestamp: new Date().toISOString()
  })
})

// Admin health check (protected - for admin operations)
app.get('/api/health/admin', authenticateToken, (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'portfolio-api',
    role: 'admin',
    timestamp: new Date().toISOString(),
    authenticated: true,
    user: req.user
  })
})

// Export app for Vercel serverless functions
// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

// Export for Vercel serverless
export default app

