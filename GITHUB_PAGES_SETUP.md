# GitHub Pages Deployment Guide

This guide will help you deploy your portfolio to GitHub Pages.

## Prerequisites

1. Your code is pushed to a GitHub repository
2. GitHub Actions are enabled for your repository

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
4. Save the settings

### 2. Configure Base Path

The deployment workflow is already set up, but you need to configure the base path:

**If your repository is named `portfolio` (or any other name):**
- The base path should be `'/portfolio/'` (already configured)
- Your site will be available at: `https://yourusername.github.io/portfolio/`

**If your repository is `yourusername.github.io`:**
- Update `.github/workflows/deploy.yml` and change:
  ```yaml
  VITE_BASE_PATH: '/portfolio/'
  ```
  to:
  ```yaml
  VITE_BASE_PATH: '/'
  ```
- Your site will be available at: `https://yourusername.github.io/`

### 3. Update Repository Name in Workflow

If your repository has a different name than `portfolio`, update the `VITE_BASE_PATH` in `.github/workflows/deploy.yml`:

```yaml
VITE_BASE_PATH: '/your-repo-name/'
```

### 4. Push to GitHub

1. Commit and push the workflow file:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages deployment workflow"
   git push origin main
   ```

2. The workflow will automatically run and deploy your site

### 5. Verify Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You should see the workflow running
3. Once complete, go to **Settings** → **Pages** to see your site URL
4. Your portfolio should be live!

## Environment Variables

Environment variables are already configured in the workflow! See **GITHUB_SECRETS_SETUP.md** for detailed instructions.

**Quick setup:**
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:
   - `VITE_API_URL` - Your backend API URL
   - `VITE_GEMINI_API_KEY` - Your Gemini API key (optional, for chatbot)
4. The workflow will automatically use them on the next deployment

## Troubleshooting

### 404 Errors

- Make sure the `base` path in `vite.config.js` matches your repository name
- Check that `VITE_BASE_PATH` in the workflow matches your repo name

### Assets Not Loading

- Ensure all assets are in the `public` folder
- Check browser console for 404 errors on specific assets

### Build Failures

- Check the **Actions** tab for error messages
- Ensure all dependencies are listed in `package.json`
- Verify Node.js version compatibility

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file in the `public` folder with your domain name
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings to use your custom domain

## Notes

- The server component (`server/`) is not deployed to GitHub Pages (it's static hosting only)
- If you need the backend API, deploy it separately (Heroku, Railway, Render, etc.)
- Update `VITE_API_URL` in your frontend to point to your backend URL

