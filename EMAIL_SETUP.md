# Gmail Setup Guide for OTP Functionality

This application uses Gmail SMTP to send OTP emails for admin login.

## Required Environment Variables

```env
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_gmail_app_password
ADMIN_EMAIL=recipient_email@gmail.com
```

**Note:** `GMAIL_USER` is the Gmail account used to send emails, and `ADMIN_EMAIL` is where OTP emails are sent.

## Step-by-Step Setup

### 1. Enable 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Sign in with your Google account
3. Under "Signing in to Google", enable **"2-Step Verification"**
4. Follow the prompts to set it up (you'll need your phone)

### 2. Generate Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
   - You may need to sign in again
2. Select **"Mail"** from the dropdown
3. Select **"Other (Custom name)"** from the device dropdown
4. Enter: `Portfolio App` (or any name you prefer)
5. Click **"Generate"**
6. **IMPORTANT**: Copy the 16-character password immediately (you won't see it again!)
   - It will look like: `abcd efgh ijkl mnop` (with spaces)
   - Remove all spaces when using it

### 3. Update `.env` File

Add these to your `.env` file:

```env
# Gmail SMTP Configuration (for sending OTP emails)
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=abcdefghijklmnop

# Admin email (where OTP emails are sent)
ADMIN_EMAIL=recipient_email@gmail.com
```

**Important:**
- `GMAIL_USER` must be a Gmail address (ending with @gmail.com)
- `GMAIL_PASSWORD` must be the 16-character App Password (no spaces)
- `ADMIN_EMAIL` can be any email address (doesn't have to be Gmail)
- Remove all spaces from the App Password
- Don't use quotes around the values

### 4. Restart Server

After updating `.env`:
1. Stop the server (Ctrl+C)
2. Restart: `npm run dev:all`

### 5. Test Configuration

Run the test script to verify your setup:

```bash
node test-email.js
```

This will test your Gmail credentials and show clear error messages if something is wrong.

## Troubleshooting

### "Authentication failed" Error

**Cause:** You're using your regular Gmail password instead of an App Password.

**Solution:**
1. Make sure 2-Step Verification is enabled
2. Generate a new App Password at: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) in `GMAIL_PASSWORD`
4. Restart the server

### "GMAIL_USER must be a Gmail address" Error

**Cause:** The email address doesn't end with @gmail.com

**Solution:**
- Use a Gmail address for `GMAIL_USER`
- The application only supports Gmail for sending emails

### App Password Not Working

1. **Verify 2-Step Verification is enabled**
   - Check: https://myaccount.google.com/security
   - It should show "2-Step Verification: On"

2. **Generate a fresh App Password**
   - Delete the old one if needed
   - Generate a new one at: https://myaccount.google.com/apppasswords
   - Make sure to copy it immediately

3. **Check for typos**
   - Make sure there are no spaces in the App Password
   - Verify the email address is correct
   - Check for extra characters or quotes

4. **Test with the test script**
   ```bash
   node test-email.js
   ```

## Gmail SMTP Settings

- **Server:** smtp.gmail.com
- **Port:** 587
- **Encryption:** STARTTLS
- **Authentication:** App Password required

## Security Notes

- Never commit your `.env` file to version control
- App Passwords are safer than regular passwords
- Each App Password can be revoked individually
- You can have multiple App Passwords for different apps

## Production Considerations

For production deployments, consider:
- Using environment variables in your hosting platform
- Using a dedicated email service (SendGrid, Mailgun, AWS SES)
- Setting up proper email monitoring and logging
