import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
dotenv.config({ path: join(__dirname, '.env') })

const emailUser = process.env.GMAIL_USER
const emailPassword = process.env.GMAIL_PASSWORD

console.log('Testing Gmail email configuration...')
console.log('Gmail User:', emailUser ? `${emailUser.substring(0, 5)}...` : 'NOT SET')
console.log('Gmail Password:', emailPassword ? `${emailPassword.length} characters` : 'NOT SET')
console.log('')

if (!emailUser || !emailPassword) {
  console.error('❌ Gmail credentials not set in .env file')
  console.error('Please set:')
  console.error('  GMAIL_USER=your_email@gmail.com')
  console.error('  GMAIL_PASSWORD=your_gmail_app_password')
  process.exit(1)
}

// Validate Gmail address
if (!emailUser.includes('@gmail.com')) {
  console.error('❌ GMAIL_USER must be a Gmail address (ending with @gmail.com)')
  process.exit(1)
}

console.log('Testing with smtp.gmail.com...')
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: emailUser,
    pass: emailPassword
  },
  tls: {
    rejectUnauthorized: false
  },
  requireTLS: true
})

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Gmail SMTP failed:', error.message)
    console.error('')
    console.error('💡 You need to:')
    console.error('   1. Enable 2-Step Verification: https://myaccount.google.com/security')
    console.error('   2. Generate App Password: https://myaccount.google.com/apppasswords')
    console.error('   3. Select "Mail" → "Other (Custom name)" → Enter "Portfolio"')
    console.error('   4. Copy the 16-character password (remove spaces)')
    console.error('   5. Update GMAIL_PASSWORD in .env with the App Password')
    console.error('   6. Your regular Gmail password will NOT work')
    process.exit(1)
  } else {
    console.log('✅ Gmail SMTP connection successful!')
    console.log('Your Gmail credentials are working correctly.')
    process.exit(0)
  }
})
