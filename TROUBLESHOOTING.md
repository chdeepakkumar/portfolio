# Troubleshooting Guide

## Gemini API Key Not Working

If you've added the API key to `.env` but it's still not working, try these steps:

### 1. Verify .env File Location
The `.env` file must be in the **root directory** of the portfolio project:
```
portfolio/
├── .env          ← Must be here
├── package.json
├── src/
└── ...
```

### 2. Check Variable Name
The variable name must be **exactly** `VITE_GEMINI_API_KEY`:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**Important**: 
- No spaces around the `=`
- No quotes around the value (unless the key itself contains quotes)
- Must start with `VITE_` prefix for Vite to expose it

### 3. Restart Dev Server
**This is critical!** Vite only reads `.env` files when the server starts.

1. Stop the dev server (Ctrl+C or Cmd+C)
2. Start it again:
   ```bash
   npm run dev
   ```

### 4. Check Browser Console
Open your browser's developer console (F12) and look for:
- `✅ API key found, initializing Gemini...` - Good!
- `❌ Gemini API key not found` - Problem with .env file
- `✅ Gemini initialized successfully` - Working!

### 5. Verify API Key Format
Your API key should:
- Start with `AIzaSy`
- Be about 39 characters long
- Have no spaces or line breaks

### 6. Test API Key
You can test if your API key works by running this in the browser console:
```javascript
console.log('API Key:', import.meta.env.VITE_GEMINI_API_KEY)
```

If it shows `undefined`, the environment variable isn't being loaded.

### 7. Common Issues

**Issue**: API key shows in console but Gemini still not working
- **Solution**: Check if the API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Make sure the API key hasn't been revoked or restricted

**Issue**: "API key not found" even though .env exists
- **Solution**: 
  1. Make sure file is named exactly `.env` (not `.env.txt` or `.env.local`)
  2. Restart the dev server
  3. Check for typos in variable name

**Issue**: Works in dev but not in production build
- **Solution**: Set the environment variable in your hosting platform:
  - Netlify: Site settings → Environment variables
  - Vercel: Project settings → Environment variables

### 8. Debug Steps

1. **Check .env file exists:**
   ```bash
   ls -la .env
   ```

2. **Verify content:**
   ```bash
   cat .env
   ```

3. **Check for hidden characters:**
   ```bash
   cat -A .env
   ```

4. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

5. **Check browser console** for debug messages

### 9. Still Not Working?

If none of the above works:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

3. Check if there are multiple `.env` files conflicting

4. Verify your API key is active at [Google AI Studio](https://aistudio.google.com/app/apikey)

### Need More Help?

Check the browser console for detailed error messages. The chatbot now includes extensive logging to help diagnose issues.

