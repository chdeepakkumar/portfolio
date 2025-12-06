# Environment Variables Setup

This project uses environment variables to store sensitive configuration like API keys. **No API keys are hardcoded in the source code.**

## Required Environment Variables

### VITE_GEMINI_API_KEY

The Google Gemini API key for the AI-powered chatbot feature.

**How to set it up:**

1. **Create a `.env` file** in the root directory of the project:
   ```bash
   cp .env.example .env
   ```

2. **Get your API key:**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key (starts with `AIzaSy...`)

3. **Add it to your `.env` file:**
   ```env
   VITE_GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
   ```
   Replace `AIzaSyYourActualApiKeyHere` with your actual API key.

4. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

## Important Notes

- ✅ The `.env` file is already in `.gitignore` - your API key will NOT be committed to git
- ✅ Never commit your `.env` file or share your API key publicly
- ✅ The API key is only read from environment variables - no hardcoding
- ⚠️ In Vite, only variables prefixed with `VITE_` are exposed to the client-side code
- ⚠️ For production, consider using a backend proxy to protect your API key

## File Structure

```
portfolio/
├── .env              # Your actual environment variables (NOT in git)
├── .env.example       # Template file (safe to commit)
└── ...
```

## Verification

To verify your environment variable is loaded:

1. Check the browser console - you should see no warnings about missing API key
2. Open the chatbot - you should see an "AI" badge in the header
3. Ask a question - you should get AI-powered responses

## Troubleshooting

**"Gemini API key not found" warning:**
- Make sure your `.env` file exists in the root directory
- Verify the variable name is exactly `VITE_GEMINI_API_KEY`
- Check there are no extra spaces or quotes around the value
- Restart your dev server after creating/modifying `.env`

**API key not working:**
- Verify the key is correct (no typos)
- Check if the key has restrictions in Google Cloud Console
- Ensure you're using the correct API key from Google AI Studio

## Production Deployment

For production deployments, set the environment variable in your hosting platform:

- **Netlify**: Site settings → Environment variables
- **Vercel**: Project settings → Environment variables
- **GitHub Pages**: Not recommended (use a backend proxy instead)
- **Other platforms**: Check their documentation for environment variable configuration

