# Vercel Deployment Guide - Frontend + Backend

This guide will help you deploy both your frontend and backend to Vercel.

## Prerequisites

1. A Vercel account ([sign up here](https://vercel.com))
2. Your code pushed to GitHub

## Quick Setup

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Select your portfolio repository
   - Click "Import"

4. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   VITE_API_URL=https://your-project.vercel.app/api
   VITE_BASE_PATH=/ (or leave unset - defaults to /)
   VITE_GEMINI_API_KEY=your_gemini_key (optional)
   NODE_ENV=production
   JWT_SECRET=your_random_secret_key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ALLOWED_ORIGINS=https://your-project.vercel.app
   ```
   
   **Note:** `VITE_BASE_PATH` defaults to `/` for Vercel. You can leave it unset.

6. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - For production: `vercel --prod`

4. **Add Environment Variables:**
   ```bash
   vercel env add VITE_API_URL
   vercel env add JWT_SECRET
   vercel env add EMAIL_USER
   # ... add all other variables
   ```

## How It Works

### Frontend
- Vercel builds your Vite app (`npm run build`)
- Serves static files from the `dist` folder
- Handles routing for your React app

### Backend
- Your Express app is converted to serverless functions
- API routes (`/api/*`) are handled by `api/index.js`
- Each API request triggers a serverless function

## File Storage on Vercel

⚠️ **Important:** Vercel serverless functions use **ephemeral storage** (`/tmp`). Files are lost when the function stops.

### Options for Persistent Storage:

#### Option 1: Vercel Blob Storage (Recommended)
1. Install Vercel Blob:
   ```bash
   npm install @vercel/blob
   ```

2. Update your code to use Blob Storage instead of file system

#### Option 2: External Storage
- Use services like:
  - **Supabase Storage** (free tier)
  - **Cloudinary** (free tier)
  - **AWS S3** (pay-as-you-go)
  - **Google Cloud Storage**

#### Option 3: Database + File References
- Store file metadata in a database
- Use external file storage
- Reference files by ID

### Current Setup (Temporary)
The current setup uses `/tmp` directory which is **ephemeral**. This means:
- ✅ Files work during function execution
- ❌ Files are lost when function stops
- ⚠️ **Not suitable for production** if you need persistent file storage

**For production**, you should migrate to one of the storage options above.

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Frontend Variables (VITE_*)
```
VITE_API_URL=https://your-project.vercel.app/api
VITE_GEMINI_API_KEY=your_gemini_key (optional)
```

### Backend Variables
```
NODE_ENV=production
JWT_SECRET=your_random_secret_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ALLOWED_ORIGINS=https://your-project.vercel.app
```

### Vercel-Specific
```
VERCEL=1
```

## Project Structure

```
portfolio/
├── api/
│   └── index.js          # Serverless function entry point
├── server/
│   ├── index.js          # Express app (exported, not started)
│   └── routes/           # API routes
├── src/                  # React frontend
├── public/               # Static assets
├── vercel.json           # Vercel configuration
└── vite.config.js       # Vite configuration
```

## API Routes

Your API will be available at:
- `https://your-project.vercel.app/api/portfolio`
- `https://your-project.vercel.app/api/auth`
- `https://your-project.vercel.app/api/health`

## Testing Locally with Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Run development server:**
   ```bash
   vercel dev
   ```
   This will:
   - Start your frontend on `http://localhost:3000`
   - Handle API routes at `http://localhost:3000/api/*`

## Troubleshooting

### CORS Errors

- Make sure `ALLOWED_ORIGINS` includes your Vercel URL
- Check that CORS middleware is configured correctly

### 404 on API Routes

- Verify `vercel.json` has the correct rewrite rules
- Check that `api/index.js` exists and exports the Express app

### File Upload Not Working

- Remember: `/tmp` storage is ephemeral
- Consider migrating to Vercel Blob or external storage

### Build Failures

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

## Updating Your Deployment

### Automatic Deployments
- Every push to `main` branch automatically deploys
- Pull requests create preview deployments

### Manual Deployments
```bash
vercel --prod
```

## Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `ALLOWED_ORIGINS` to include your custom domain

## Free Tier Limits

Vercel's free tier includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless function execution time limits
- ✅ File size limits (4.5MB for serverless functions)

## Next Steps

1. ✅ Deploy to Vercel (follow steps above)
2. ⚠️ **Migrate file storage** to persistent solution (Vercel Blob, Supabase, etc.)
3. ✅ Test all API endpoints
4. ✅ Test file uploads/downloads
5. ✅ Configure custom domain (optional)

## Migration to Persistent Storage

When ready, you'll need to:
1. Choose a storage solution (Vercel Blob recommended)
2. Update `server/routes/portfolio.js` to use storage API
3. Update file upload/download logic
4. Test thoroughly

See `BACKEND_DEPLOYMENT.md` for alternative hosting options if you need traditional file system access.

