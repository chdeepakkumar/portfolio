# Gemini Model Fix Guide

## The Issue
You're getting a 404 error saying the model `gemini-2.5-flash` is not found. This usually means:
1. The API key doesn't have access to that model
2. The model name format is incorrect
3. The API endpoint has changed

## Quick Fix Steps

### Option 1: Verify Your API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Check if your API key is active
3. Verify which models are available for your key
4. Some API keys might only have access to `gemini-pro` (older model)

### Option 2: Try Different Model Names
The code now tries multiple model names automatically. Check the browser console to see which one works.

### Option 3: Create a New API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Make sure it has access to Gemini models
4. Update your `.env` file with the new key

### Option 4: Check API Key Restrictions
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Check if your API key has any restrictions
4. Make sure "Generative Language API" is enabled

## Testing
After updating, restart your dev server and check the browser console. You should see:
- `✅ Gemini initialized successfully with model: [model-name]`

If you still see errors, the console will show which models were tried and why they failed.

