# Vercel Blob Storage Setup Guide

This guide will help you set up Vercel Blob Storage so your portfolio data persists across deployments.

## ✅ What's Been Done

1. ✅ Installed `@vercel/blob` package
2. ✅ Created storage abstraction layer (`server/utils/storage.js`)
3. ✅ Updated all file operations to use blob storage on Vercel
4. ✅ Maintained file system storage for local development

## 📋 Setup Steps

### Step 1: Create a Blob Store in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your portfolio project
3. Click on the **Storage** tab
4. Click **Create Database** or **Add Storage**
5. Select **Blob** from the options
6. Name your blob store (e.g., "portfolio-storage")
7. Click **Create**

### Step 2: Get Your Blob Token

After creating the blob store:

1. Vercel automatically adds a `BLOB_READ_WRITE_TOKEN` environment variable
2. This token is automatically available in your Vercel deployments
3. **For local development**, you need to add it to your `.env` file

### Step 3: Add Environment Variable Locally

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Find `BLOB_READ_WRITE_TOKEN`
3. Copy the token value
4. Add it to your local `.env` file:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx_xxxxx
```

**Note:** The token is automatically available in Vercel deployments, so you only need to add it locally for development.

### Step 4: Pull Environment Variables (Optional)

Alternatively, you can use Vercel CLI to pull environment variables:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment variables (this will update your .env file)
vercel env pull
```

## 🔄 How It Works

### Local Development
- Uses file system storage in `server/data/` directory
- No blob token needed (but won't hurt if present)
- Files persist normally on your machine

### Vercel Deployment
- Automatically uses Vercel Blob Storage when:
  - `VERCEL=1` environment variable is set (automatic on Vercel)
  - `BLOB_READ_WRITE_TOKEN` is available
- All data persists across deployments
- Files are stored in your Vercel Blob store

## 📁 What Gets Stored

The following data is now persisted in Vercel Blob:

1. **Portfolio Data** (`knowledge/portfolio.json`)
   - All section content (hero, about, skills, experience, etc.)
   - Section visibility and order
   - All admin panel changes

2. **Knowledge Files** (`knowledge/*.json`)
   - All uploaded knowledge files for the chatbot
   - Used by the AI assistant

3. **Resume Files** (`resume/*.pdf`)
   - All uploaded resume PDFs
   - Resume metadata (active resume selection)

4. **User Data** (`users.json`)
   - Admin user information
   - Refresh tokens

## 🧪 Testing

### Test Locally

1. Make sure your `.env` file has `BLOB_READ_WRITE_TOKEN` (optional for local)
2. Start your development server:
   ```bash
   npm run dev:all
   ```
3. Make changes via admin panel
4. Restart server - changes should persist (using file system)

### Test on Vercel

1. Deploy to Vercel (push to your main branch)
2. Make changes via admin panel on the deployed site
3. Redeploy - changes should persist (using blob storage)

## ⚠️ Important Notes

1. **Free Tier Limits:**
   - 1 GB storage per month
   - 10,000 simple operations per month
   - 10 GB data transfer per month
   - This should be more than enough for a portfolio site

2. **Data Migration:**
   - Existing local data in `server/data/` will continue to work locally
   - On first Vercel deployment, the blob store will be empty
   - You'll need to re-upload files or make changes via admin panel

3. **Backup:**
   - Consider backing up important data
   - Vercel Blob provides durability, but backups are always good practice

## 🐛 Troubleshooting

### "BLOB_READ_WRITE_TOKEN not found"

- Make sure you've created a blob store in Vercel
- Check that the environment variable is set in Vercel dashboard
- For local development, add it to your `.env` file

### Data Not Persisting

- Verify `VERCEL=1` is set (automatic on Vercel)
- Check that `BLOB_READ_WRITE_TOKEN` is available
- Check Vercel deployment logs for errors
- Verify blob store is created and active

### Local Development Issues

- If blob token is not set locally, it will use file system (this is fine)
- Make sure `server/data/` directory exists
- Check file permissions

## 📚 Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## ✅ Verification Checklist

- [ ] Blob store created in Vercel dashboard
- [ ] `BLOB_READ_WRITE_TOKEN` available in Vercel (automatic)
- [ ] `BLOB_READ_WRITE_TOKEN` added to local `.env` (for local dev)
- [ ] Deployed to Vercel
- [ ] Made changes via admin panel
- [ ] Redeployed - changes persisted ✅

---

**You're all set!** Your portfolio data will now persist across all Vercel deployments. 🎉

