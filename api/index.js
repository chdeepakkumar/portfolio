// Vercel serverless function wrapper for Express app
// This file is in /api directory to match Vercel's routing

// Set Vercel environment flag
process.env.VERCEL = '1'

// Import the Express app
import app from '../server/index.js'

// Export as default for Vercel serverless function
export default app

