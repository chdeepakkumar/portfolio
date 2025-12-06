# Setting Up Environment Variables for GitHub Pages

Since GitHub Pages is static hosting, environment variables need to be added as **GitHub Secrets** and are baked into your build at build-time.

## Required Environment Variables

Your portfolio uses these environment variables:

1. **`VITE_API_URL`** - Your backend API URL (e.g., `https://your-backend.herokuapp.com/api`)
2. **`VITE_GEMINI_API_KEY`** - Your Google Gemini API key for the chatbot feature

## How to Add GitHub Secrets

### Step 1: Go to Repository Settings

1. Navigate to your GitHub repository
2. Click on **Settings** (top menu)
3. In the left sidebar, click on **Secrets and variables** → **Actions**

### Step 2: Add Each Secret

For each environment variable you need:

1. Click **New repository secret**
2. Enter the **Name** (must match exactly):
   - `VITE_API_URL` for your backend API URL
   - `VITE_GEMINI_API_KEY` for your Gemini API key
3. Enter the **Secret** value
4. Click **Add secret**

### Step 3: Verify in Workflow

The workflow file (`.github/workflows/deploy.yml`) is already configured to use these secrets:

```yaml
env:
  VITE_API_URL: ${{ secrets.VITE_API_URL }}
  VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
```

## Example Values

### VITE_API_URL

**⚠️ Important:** GitHub Pages can only host static files. Your Express backend must be deployed separately.

**Deploy your backend first** (see `BACKEND_DEPLOYMENT.md` for instructions), then use that URL:

```
https://your-backend.railway.app/api
https://your-backend.onrender.com/api
https://your-backend.vercel.app/api
https://your-backend.herokuapp.com/api
```

**If you don't have a backend deployed yet:**
- The app will try to use `http://localhost:3001/api` (won't work on GitHub Pages)
- **You must deploy your backend** to a service like Railway, Render, or Vercel
- See `BACKEND_DEPLOYMENT.md` for step-by-step instructions

### VITE_GEMINI_API_KEY

Your Google Gemini API key (starts with `AIza...`):
```
AIzaSyYourActualApiKeyHere
```

## Important Notes

### ⚠️ Security

- **Never commit** `.env` files or API keys to your repository
- GitHub Secrets are encrypted and only accessible during workflow runs
- Secrets are NOT exposed in the built files (they're replaced at build time)

### 🔄 Build-Time vs Runtime

- Vite environment variables are **build-time** variables
- They get replaced during the build process
- If you change a secret, you need to **re-run the workflow** or push a new commit

### 📝 Variable Naming

- All Vite environment variables **must** start with `VITE_`
- The names in GitHub Secrets must match exactly (case-sensitive)
- Example: `VITE_API_URL` not `VITE_API_URL` or `API_URL`

## Testing Locally

For local development, create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
VITE_GEMINI_API_KEY=your_api_key_here
```

**Important:** Add `.env` to your `.gitignore` (it should already be there) to prevent committing secrets.

## Verifying Secrets Are Working

1. After adding secrets, push a commit or manually trigger the workflow
2. Check the workflow logs in the **Actions** tab
3. The build should complete successfully
4. Test your deployed site to ensure:
   - API calls work (if you have a backend)
   - Chatbot works (if you added the Gemini key)

## Troubleshooting

### Secrets Not Working?

1. **Check the name** - Must match exactly (case-sensitive)
2. **Check the workflow** - Ensure `${{ secrets.VARIABLE_NAME }}` matches your secret name
3. **Re-run workflow** - Secrets are only available during workflow execution
4. **Check build logs** - Look for any errors in the Actions tab

### Build Fails?

- Check if all required secrets are added
- Verify secret names match the workflow file
- Check the Actions tab for specific error messages

### API Calls Not Working?

- Verify `VITE_API_URL` points to your actual backend
- Check CORS settings on your backend
- Ensure your backend is deployed and accessible

## Optional: Environment-Specific Builds

If you want different values for different environments, you can:

1. Create separate workflows for different branches
2. Use different secret names (e.g., `VITE_API_URL_STAGING`, `VITE_API_URL_PRODUCTION`)
3. Conditionally set values based on the branch

Example:
```yaml
env:
  VITE_API_URL: ${{ github.ref == 'refs/heads/main' && secrets.VITE_API_URL_PROD || secrets.VITE_API_URL_STAGING }}
```

