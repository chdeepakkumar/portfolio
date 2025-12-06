# Backend Deployment Guide

Since GitHub Pages only serves static files, your Express backend needs to be deployed separately. Here are the best options:

## Option 1: Railway (Recommended - Easiest)

Railway is the easiest way to deploy Node.js apps.

### Steps:

1. **Sign up** at [railway.app](https://railway.app) (free tier available)

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure the service:**
   - Railway will auto-detect it's a Node.js app
   - Set the **Root Directory** to `/` (or leave default)
   - Set the **Start Command** to: `node server/index.js`

4. **Add Environment Variables:**
   - Go to **Variables** tab
   - Add these variables:
     ```
     PORT=3001
     NODE_ENV=production
     ALLOWED_ORIGINS=https://yourusername.github.io,https://yourusername.github.io/portfolio
     JWT_SECRET=your_jwt_secret_here
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your_email@gmail.com
     EMAIL_PASS=your_app_password
     GEMINI_API_KEY=your_gemini_key (if needed)
     ```

5. **Get your backend URL:**
   - Railway will give you a URL like: `https://your-app.railway.app`
   - Your API will be at: `https://your-app.railway.app/api`

6. **Update CORS:**
   - Make sure `ALLOWED_ORIGINS` includes your GitHub Pages URL

---

## Option 2: Render

### Steps:

1. **Sign up** at [render.com](https://render.com) (free tier available)

2. **Create a new Web Service:**
   - Connect your GitHub repository
   - Select your repository

3. **Configure:**
   - **Name:** portfolio-backend (or any name)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Root Directory:** Leave empty (or set to root)

4. **Add Environment Variables:**
   - Same as Railway (see above)

5. **Get your backend URL:**
   - Render gives you: `https://your-app.onrender.com`
   - Your API: `https://your-app.onrender.com/api`

---

## Option 3: Vercel (Serverless Functions)

Vercel can host your Express app as serverless functions.

### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json` in your project root:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server/index.js"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add environment variables** in Vercel dashboard

---

## Option 4: Heroku

### Steps:

1. **Install Heroku CLI** and login

2. **Create `Procfile` in project root:**
   ```
   web: node server/index.js
   ```

3. **Deploy:**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

4. **Add environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ALLOWED_ORIGINS=https://yourusername.github.io
   # ... add other variables
   ```

---

## After Backend Deployment

### 1. Get Your Backend URL

Your backend will be at one of these:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Vercel: `https://your-app.vercel.app`
- Heroku: `https://your-app.herokuapp.com`

### 2. Add to GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add secret: `VITE_API_URL`
3. Value: `https://your-backend-url.com/api` (include `/api` at the end)

### 3. Update CORS on Backend

Make sure your backend's `ALLOWED_ORIGINS` includes:
- Your GitHub Pages URL: `https://yourusername.github.io`
- Or with subdirectory: `https://yourusername.github.io/portfolio`

Example for Railway/Render:
```env
ALLOWED_ORIGINS=https://yourusername.github.io,https://yourusername.github.io/portfolio
```

### 4. Test the Connection

After deploying:
1. Visit: `https://your-backend-url.com/api/health`
2. Should return: `{"status":"ok","service":"portfolio-api",...}`

---

## Required Environment Variables

Add these to your backend hosting platform:

```env
# Server
PORT=3001
NODE_ENV=production

# CORS - Add your GitHub Pages URL
ALLOWED_ORIGINS=https://yourusername.github.io,https://yourusername.github.io/portfolio

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_key_here

# Email (for OTP login)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Optional: Gemini API (if using chatbot)
GEMINI_API_KEY=your_gemini_key
```

---

## Quick Setup Script

For Railway, you can create a `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Troubleshooting

### CORS Errors

- Make sure `ALLOWED_ORIGINS` includes your exact GitHub Pages URL
- Check if your backend URL is correct
- Verify CORS middleware is working

### 404 Errors

- Ensure your backend URL ends with `/api`
- Check that routes are mounted at `/api`

### Environment Variables Not Working

- Restart your backend service after adding variables
- Check variable names match exactly (case-sensitive)

---

## Recommended Setup

**For beginners:** Use **Railway** - it's the easiest and has a generous free tier.

**For production:** Use **Render** or **Railway** - both are reliable and easy to use.

**For serverless:** Use **Vercel** - great for scaling but requires more configuration.

