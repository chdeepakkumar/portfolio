import crypto from 'crypto'

/**
 * Generate or retrieve a session ID for rate limiting
 * Uses a combination of IP, User-Agent, and a cookie to create a unique session
 */
export function getSessionId(req) {
  // For authenticated users, use user ID from JWT token
  if (req.user && req.user.userId) {
    return `user:${req.user.userId}`
  }
  
  // For unauthenticated users, create a session identifier
  // Check if there's a session cookie or header
  const sessionCookie = (req.cookies && req.cookies.sessionId) || req.headers['x-session-id']
  
  if (sessionCookie) {
    return `session:${sessionCookie}`
  }
  
  // Generate a session ID based on request fingerprint
  // This creates a consistent identifier for the same user/browser
  // Used as fallback when cookies aren't available
  const fingerprint = [
    req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
    req.headers['user-agent'] || 'unknown',
    req.headers['accept-language'] || 'unknown'
  ].join('|')
  
  // Create a hash of the fingerprint for privacy
  const sessionHash = crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex')
    .substring(0, 16)
  
  return `session:${sessionHash}`
}

/**
 * Middleware to set session cookie if not present
 */
export function sessionMiddleware(req, res, next) {
  // Only set cookie for public endpoints (not authenticated)
  if (!req.user) {
    const hasSessionCookie = req.cookies && req.cookies.sessionId
    const hasSessionHeader = req.headers['x-session-id']
    
    if (!hasSessionCookie && !hasSessionHeader) {
      // Generate a new session ID
      const sessionId = crypto.randomBytes(16).toString('hex')
      
      // Set cookie (HttpOnly for security, SameSite for CSRF protection)
      // Only set cookie if cookieParser is available
      if (res.cookie) {
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        })
      }
      
      // Also set in header for clients that don't support cookies
      res.setHeader('X-Session-Id', sessionId)
      
      // Store in request for immediate use
      if (!req.cookies) req.cookies = {}
      req.cookies.sessionId = sessionId
    }
  }
  
  next()
}

