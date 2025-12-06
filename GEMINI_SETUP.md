# Google Gemini API Setup Guide

This guide will help you set up the Google Gemini API for the AI-powered chatbot feature.

## Step 1: Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) or [MakerSuite](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy your API key (it will look like: `AIzaSy...`)

## Step 2: Configure the API Key

1. In the portfolio root directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and add your API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Replace `your_actual_api_key_here` with the API key you copied

## Step 3: Restart the Development Server

If your dev server is running, restart it to load the new environment variable:

```bash
# Stop the server (Ctrl+C)
# Then start it again
npm run dev
```

## Step 4: Verify It's Working

1. Open your portfolio in the browser
2. Click the chatbot button (bottom-right)
3. You should see "AI" badge in the chatbot header
4. Ask a question - you should get intelligent AI-powered responses

## Troubleshooting

### Chatbot shows fallback mode
- Check that your `.env` file exists in the root directory
- Verify the variable name is exactly `VITE_GEMINI_API_KEY`
- Make sure you restarted the dev server after adding the key
- Check the browser console for any error messages

### API Key Not Working
- Verify your API key is correct (no extra spaces)
- Check if your API key has usage limits or restrictions
- Ensure you're using the correct API key from Google AI Studio

### Security Note
⚠️ **Important**: The API key will be visible in the client-side code. For production:
- Set up API key restrictions in Google Cloud Console
- Consider using a backend proxy to protect your API key
- Use different keys for development and production

## Free Tier Limits

Google Gemini API has a generous free tier:
- 60 requests per minute
- 1,500 requests per day

For most portfolio sites, this is more than sufficient!

## Need Help?

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)
- Check the main README.md for more information

