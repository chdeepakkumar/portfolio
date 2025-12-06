import nodemailer from 'nodemailer'

// Function to get Gmail credentials (called each time to ensure fresh values)
function getEmailCredentials() {
  const emailUser = process.env.GMAIL_USER
  const emailPassword = process.env.GMAIL_PASSWORD
  return { emailUser, emailPassword }
}

// Function to create Gmail transporter
function createTransporter() {
  const { emailUser, emailPassword } = getEmailCredentials()
  
  if (!emailUser || !emailPassword) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_PASSWORD in .env file and restart the server.')
  }
  
  // Validate that it's a Gmail address
  if (!emailUser.includes('@gmail.com')) {
    throw new Error('GMAIL_USER must be a Gmail address (ending with @gmail.com)')
  }
  
  // Gmail SMTP configuration
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: emailUser,
      pass: emailPassword
    },
    tls: {
      rejectUnauthorized: false
    },
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  })
}

// Validation will happen when sendOTPEmail is called, not at module load
// This ensures dotenv.config() has time to load environment variables

export const sendOTPEmail = async (email, otp) => {
  // Get fresh credentials each time
  const { emailUser, emailPassword } = getEmailCredentials()
  
  // Validate email configuration
  if (!emailUser || !emailPassword) {
    const errorMsg = 'Gmail configuration missing: GMAIL_USER and GMAIL_PASSWORD must be set in .env file. Please add them and restart the server.'
    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }
  
  // Validate Gmail address
  if (!emailUser.includes('@gmail.com')) {
    const errorMsg = 'GMAIL_USER must be a Gmail address (ending with @gmail.com)'
    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }
  
  // Create transporter with current credentials
  const transporter = createTransporter()
  
  const mailOptions = {
    from: emailUser,
    to: email,
    subject: 'Admin Login OTP - Portfolio',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #64ffda;">Admin Login One-Time Password</h2>
        <p>You requested an OTP to access the Portfolio Admin panel.</p>
        <div style="background-color: #0a0e27; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #8892b0; margin: 0 0 10px 0;">Your OTP code is:</p>
          <p style="font-size: 32px; font-weight: bold; color: #64ffda; letter-spacing: 4px; margin: 0; font-family: 'Courier New', monospace;">
            ${otp}
          </p>
        </div>
        <p style="color: #8892b0; font-size: 14px;">
          Enter this code in the login form to complete your authentication.
        </p>
        <p style="color: #8892b0; font-size: 12px; margin-top: 30px;">
          This OTP will expire in 5 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message)
    if (error.code === 'EAUTH' || error.message.includes('535') || error.message.includes('Authentication unsuccessful')) {
      console.error('💡 Gmail authentication failed. You need to:')
      console.error('   1. Enable 2-Step Verification: https://myaccount.google.com/security')
      console.error('   2. Generate App Password: https://myaccount.google.com/apppasswords')
      console.error('   3. Select "Mail" and "Other (Custom name)" → Enter "Portfolio"')
      console.error('   4. Copy the 16-character password (remove spaces)')
      console.error('   5. Update GMAIL_PASSWORD in .env with the App Password')
      console.error('   6. Restart the server')
      console.error('   7. Your regular Gmail password will NOT work - you MUST use an App Password')
    }
    return false
  }
}

