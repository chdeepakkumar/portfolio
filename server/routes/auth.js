import express from 'express'
import jwt from 'jsonwebtoken'
import { sendOTPEmail } from '../utils/email.js'
import { storage } from '../utils/storage.js'
import crypto from 'crypto'

const router = express.Router()

const USERS_FILE = 'users.json'

// In-memory OTP storage
// Structure: { otp: string, expiresAt: Date, used: boolean }
const otpStore = new Map()

// Clean up expired OTPs every minute
setInterval(() => {
  const now = new Date()
  for (const [otp, data] of otpStore.entries()) {
    if (data.expiresAt < now || data.used) {
      otpStore.delete(otp)
    }
  }
}, 60000) // Run every minute

// Generate 8-character alphanumeric OTP
const generateOTP = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let otp = ''
  for (let i = 0; i < 8; i++) {
    otp += chars.charAt(crypto.randomInt(0, chars.length))
  }
  return otp
}

// Helper to read users
const readUsers = async () => {
  try {
    const exists = await storage.exists(USERS_FILE)
    if (!exists) {
      throw new Error('ENOENT')
    }
    const data = await storage.readFile(USERS_FILE)
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, create default user
    if (error.message === 'ENOENT') {
      // Use ADMIN_EMAIL from environment - must be set
      const adminEmail = process.env.ADMIN_EMAIL
      if (!adminEmail) {
        console.error('❌ ADMIN_EMAIL environment variable not set')
        throw new Error('ADMIN_EMAIL environment variable must be set in .env file')
      }
      
      console.log('📝 Creating default user file...')
      const defaultUsers = {
        users: [{
          id: '1',
          username: 'admin',
          email: adminEmail,
          createdAt: new Date().toISOString()
        }]
      }
      try {
        await storage.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2))
        console.log('✅ Default user file created successfully')
        return defaultUsers
      } catch (writeError) {
        console.error('❌ Error creating default user file:', writeError)
        throw new Error(`Failed to create user file: ${writeError.message}`)
      }
    }
    console.error('❌ Error reading users file:', error)
    throw error
  }
}

// Helper to write users
const writeUsers = async (users) => {
  try {
    await storage.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('❌ Error writing users file:', error)
    throw new Error(`Failed to save user data: ${error.message}`)
  }
}

// Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { password } = req.body

    // Input validation
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password required' })
    }
    
    // Prevent extremely long passwords (potential DoS)
    if (password.length > 1000) {
      return res.status(400).json({ error: 'Invalid input' })
    }

    // Validate password against environment variable
    const otpPassword = process.env.OTP_PASSWORD
    if (!otpPassword) {
      console.error('OTP_PASSWORD environment variable not set')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    if (password !== otpPassword) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store OTP
    otpStore.set(otp, {
      expiresAt,
      used: false
    })

    // Send OTP email to admin email from environment variable
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable not set')
      return res.status(500).json({ error: 'Server configuration error: ADMIN_EMAIL not set' })
    }
    const emailSent = await sendOTPEmail(adminEmail, otp)

    if (!emailSent) {
      otpStore.delete(otp) // Remove OTP if email failed
      return res.status(500).json({ error: 'Failed to send OTP email' })
    }

    res.json({ message: 'OTP has been sent to your email' })
  } catch (error) {
    console.error('Request OTP error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login with OTP
router.post('/login', async (req, res) => {
  try {
    const { otp } = req.body

    // Input validation
    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({ error: 'OTP required' })
    }
    
    // OTP should be exactly 8 characters (alphanumeric)
    if (otp.length !== 8 || !/^[A-Za-z0-9]+$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP format' })
    }

    // Normalize OTP to uppercase for case-insensitive comparison
    const normalizedOtp = otp.toUpperCase()
    
    // Find matching OTP (case-insensitive)
    let otpData = null
    let actualOtpKey = null
    for (const [storedOtp, data] of otpStore.entries()) {
      if (storedOtp.toUpperCase() === normalizedOtp) {
        otpData = data
        actualOtpKey = storedOtp
        break
      }
    }

    if (!otpData) {
      return res.status(401).json({ error: 'Invalid OTP' })
    }

    if (otpData.used) {
      return res.status(401).json({ error: 'OTP has already been used' })
    }

    if (otpData.expiresAt < new Date()) {
      otpStore.delete(actualOtpKey)
      return res.status(401).json({ error: 'OTP has expired' })
    }

    // Mark OTP as used
    otpData.used = true
    otpStore.set(actualOtpKey, otpData)

    // Get admin user
    const usersData = await readUsers()
    const user = usersData.users.find(u => u.username === 'admin')

    if (!user) {
      return res.status(500).json({ error: 'Admin user not found' })
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    // Save refresh token to user
    user.refreshToken = refreshToken
    await writeUsers(usersData)

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error message:', error.message)
    
    // Provide more specific error messages
    if (error.message?.includes('JWT_SECRET') || error.message?.includes('JWT_REFRESH_SECRET')) {
      return res.status(500).json({ error: 'Server configuration error: JWT secrets not configured' })
    }
    if (error.message?.includes('ENOENT') || error.message?.includes('not found')) {
      return res.status(500).json({ error: 'User data not found. Please contact administrator.' })
    }
    if (error.message?.includes('BLOB') || error.message?.includes('blob')) {
      return res.status(500).json({ error: 'Storage error. Please check blob storage configuration.' })
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    // Input validation
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'Refresh token required' })
    }
    
    // Basic JWT format validation (should start with header)
    if (refreshToken.length > 2000 || !refreshToken.includes('.')) {
      return res.status(400).json({ error: 'Invalid token format' })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const usersData = await readUsers()
    const user = usersData.users.find(u => u.id === decoded.userId)

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' })
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({ accessToken })
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired refresh token' })
  }
})


export default router

