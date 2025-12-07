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

5. **Set up Vercel Blob Storage** (Required for data persistence):
   - Go to **Storage** tab in your project
   - Create a new **Blob** store
   - The `BLOB_READ_WRITE_TOKEN` will be automatically added
   - See `VERCEL_BLOB_SETUP.md` for detailed instructions

6. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   VITE_API_URL=https://your-project.vercel.app/api
   VITE_BASE_PATH=/ (or leave unset - defaults to /)
   VITE_GEMINI_API_KEY=your_gemini_key (optional)
   NODE_ENV=production
   JWT_SECRET=your_random_secret_key
   ADMIN_EMAIL=your_email@example.com
   OTP_PASSWORD=your_otp_password
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASSWORD=your_gmail_app_password
   ALLOWED_ORIGINS=https://your-project.vercel.app
   ```
   
   **Note:** 
   - `VITE_BASE_PATH` defaults to `/` for Vercel. You can leave it unset.
   - `BLOB_READ_WRITE_TOKEN` is automatically added when you create a blob store.
   - `VERCEL=1` is automatically set by Vercel (don't add manually).

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

✅ **Vercel Blob Storage is now implemented!** All data persists across deployments.

### Current Setup

The portfolio now uses **Vercel Blob Storage** for persistent file storage:

- ✅ **Portfolio data** (`portfolio.json`) - All section content and settings
- ✅ **Knowledge files** - Chatbot knowledge base files
- ✅ **Resume files** - Uploaded PDF resumes
- ✅ **User data** - Admin user information

### Setting Up Vercel Blob Storage

**This is required for data persistence on Vercel!**

1. **Create a Blob Store:**
   - Go to Vercel Dashboard → Your Project → **Storage** tab
   - Click **Create** → Select **Blob**
   - Name it (e.g., "portfolio-storage")
   - Click **Create**

2. **Environment Variable:**
   - Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project
   - For local development, add it to your `.env` file (optional)
   - Or use `vercel env pull` to pull all environment variables

3. **That's it!** Your data will now persist across all deployments.

See `VERCEL_BLOB_SETUP.md` for detailed setup instructions.

### How It Works

- **Local Development**: Uses file system (`server/data/`) - no blob token needed
- **Vercel Deployment**: Automatically uses Vercel Blob Storage when:
  - `VERCEL=1` is set (automatic on Vercel)
  - `BLOB_READ_WRITE_TOKEN` is available (automatic after creating blob store)

### Free Tier Limits

Vercel Blob free tier includes:
- ✅ 1 GB storage per month
- ✅ 10,000 simple operations per month
- ✅ 10 GB data transfer per month
- ✅ More than enough for a portfolio site!

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
ADMIN_EMAIL=your_email@example.com
OTP_PASSWORD=your_otp_password
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_gmail_app_password
ALLOWED_ORIGINS=https://your-project.vercel.app
```

### Vercel-Specific (Auto-configured)
```
VERCEL=1                    # Automatically set by Vercel
BLOB_READ_WRITE_TOKEN=...   # Automatically added when you create a blob store
```

**Note:** You don't need to manually set `VERCEL=1` or `BLOB_READ_WRITE_TOKEN` - they're automatically configured by Vercel.

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

- ✅ Vercel Blob Storage is now implemented - files persist!
- If uploads fail, check that:
  - Blob store is created in Vercel Dashboard
  - `BLOB_READ_WRITE_TOKEN` is available (automatic after creating blob store)
  - Check deployment logs for errors

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
2. ✅ **Set up Vercel Blob Storage** (see `VERCEL_BLOB_SETUP.md`)
3. ✅ Test all API endpoints
4. ✅ Test file uploads/downloads
5. ✅ Make changes via admin panel - they will persist across deployments!
6. ✅ Configure custom domain (optional)

## Data Persistence

✅ **All data now persists across deployments!**

- Portfolio content changes made via admin panel
- Knowledge files uploaded for chatbot
- Resume files uploaded
- All settings and configurations

**Important:** Make sure you've created a Blob Store in Vercel (see `VERCEL_BLOB_SETUP.md`). Without it, data will be lost on redeploy.

See `VERCEL_BLOB_SETUP.md` for complete setup instructions.

