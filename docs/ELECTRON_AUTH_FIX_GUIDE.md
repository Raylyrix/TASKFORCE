# 🔧 Electron Authentication Fix Guide

## **🚨 Problem Identified**

Your Electron app is experiencing OAuth authentication issues with these errors:
- `invalid_client` - OAuth client configuration problem
- `invalid_grant` - Expired or invalid tokens
- "Authentication failed to attach" - Token refresh issues

## **🎯 Root Cause**

The issue is that your Electron app's OAuth tokens have expired or the OAuth configuration is misconfigured. The app is trying to use old tokens that are no longer valid.

## **✅ Solution Overview**

I've created a comprehensive fix that includes:

1. **Backend Bridge** - New API endpoints for Electron app compatibility
2. **OAuth Helper Tool** - Web interface to get fresh tokens
3. **Fix Script** - Automated tool to resolve authentication issues

---

## **🚀 Quick Fix (Recommended)**

### **Step 1: Start the Backend**
```bash
# In your project root
cd apps/backend
pnpm install
pnpm dev
```

### **Step 2: Use the OAuth Helper**
1. Open your browser and go to: `http://localhost:3000/oauth-helper.html`
2. Click "Generate Authorization URL"
3. Click "Open in Browser" to authorize with Google
4. Copy the authorization code from the browser
5. Paste it in the helper and click "Exchange for Tokens"
6. Your Electron app should now work!

### **Step 3: Test Your Electron App**
Go back to your Electron app and try logging in again. The authentication should work properly now.

---

## **🔧 Alternative: Automated Fix Script**

### **Run the Fix Script**
```bash
# In your project root
node scripts/fix-electron-auth.js
```

This script will:
1. Check if the backend is running
2. Generate a fresh authorization URL
3. Open your browser for authorization
4. Help you exchange the code for new tokens
5. Verify everything is working

---

## **🛠️ Manual Configuration Check**

### **1. Verify Environment Variables**
Make sure your `.env` file has the correct OAuth credentials:

```bash
# Gmail OAuth (Web Application OAuth Client)
GMAIL_CLIENT_ID="1007595181381-dd7o4v4jh01b1pcar6a681hj6pmjdsnp.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="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"
GMAIL_REDIRECT_URI="http://localhost:4000/auth/google/callback"
FRONTEND_URL="http://localhost:3000"
```

### **2. Google Cloud Console Configuration**
Verify your OAuth application is configured correctly:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Find your OAuth 2.0 Client ID
4. Make sure it's configured as a **"Web application"**
5. Add these redirect URIs:
   - `http://localhost:4000/auth/google/callback`
   - `http://localhost:3000/auth/callback`
   - `urn:ietf:wg:oauth:2.0:oob` (for Electron compatibility)

### **3. Enable Required APIs**
Make sure these APIs are enabled in Google Cloud Console:
- Gmail API
- Google People API
- Google+ API (if available)

---

## **🔍 Troubleshooting Common Issues**

### **Issue 1: "invalid_client" Error**
**Cause:** OAuth client ID or secret is incorrect
**Solution:**
1. Double-check your `.env` file credentials
2. Verify the credentials in Google Cloud Console
3. Make sure the OAuth app is enabled

### **Issue 2: "invalid_grant" Error**
**Cause:** Tokens have expired or are invalid
**Solution:**
1. Use the OAuth Helper tool to get fresh tokens
2. Run the fix script to regenerate tokens
3. Clear any stored tokens in your Electron app

### **Issue 3: "Authentication failed to attach"**
**Cause:** Token refresh mechanism is failing
**Solution:**
1. Get fresh tokens using the helper tool
2. Restart your Electron app
3. Try logging in again

### **Issue 4: Redirect URI Mismatch**
**Cause:** OAuth app redirect URI doesn't match
**Solution:**
1. Add `urn:ietf:wg:oauth:2.0:oob` to your OAuth app redirect URIs
2. Make sure it's configured for desktop applications
3. Update your `.env` file if needed

---

## **📋 New API Endpoints for Electron**

I've added these new endpoints to help your Electron app:

### **Get Authorization URL**
```bash
GET http://localhost:4000/auth/electron/authorize
```
Returns a Google OAuth URL for desktop applications.

### **Exchange Code for Tokens**
```bash
POST http://localhost:4000/auth/electron/token-exchange
Content-Type: application/json

{
  "code": "your_authorization_code"
}
```
Exchanges authorization code for fresh tokens.

### **Refresh Tokens**
```bash
POST http://localhost:4000/auth/electron/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```
Refreshes expired access tokens.

### **Sync Mailbox Data**
```bash
POST http://localhost:4000/api/v1/electron/sync
Content-Type: application/json

{
  "mailboxId": "mailbox_id",
  "messages": [/* message data */]
}
```
Syncs email data from Electron app to the analytics platform.

---

## **🎯 Integration with Your Electron App**

To integrate these fixes with your existing Electron app:

### **1. Update Authentication Flow**
```javascript
// In your Electron app's authentication code
async function authenticateWithGoogle() {
  try {
    // Get authorization URL from backend
    const response = await fetch('http://localhost:4000/auth/electron/authorize');
    const data = await response.json();
    
    if (data.success) {
      // Open authorization URL
      const authUrl = data.data.authUrl;
      // Handle the authorization flow...
      
      // Exchange code for tokens
      const tokenResponse = await fetch('http://localhost:4000/auth/electron/token-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authorizationCode })
      });
      
      const tokenData = await tokenResponse.json();
      if (tokenData.success) {
        // Store tokens and proceed
        return tokenData.data;
      }
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}
```

### **2. Token Refresh Logic**
```javascript
async function refreshTokens(refreshToken) {
  try {
    const response = await fetch('http://localhost:4000/auth/electron/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.tokens;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Trigger re-authentication
    return await authenticateWithGoogle();
  }
}
```

---

## **🚀 Advanced Features**

### **Automatic Token Management**
The backend now handles:
- ✅ Token storage and encryption
- ✅ Automatic token refresh
- ✅ User and mailbox management
- ✅ Data synchronization

### **Analytics Integration**
Your Electron app can now:
- ✅ Sync email data to the analytics platform
- ✅ Generate reports from email activity
- ✅ Get AI-powered insights
- ✅ Track response times and patterns

### **Real-time Updates**
- ✅ Live dashboard updates
- ✅ Email volume tracking
- ✅ Contact health monitoring
- ✅ Performance metrics

---

## **📞 Support**

If you're still having issues:

1. **Check the logs** - Look for specific error messages
2. **Verify backend** - Make sure `http://localhost:4000/health` returns success
3. **Test OAuth Helper** - Use `http://localhost:3000/oauth-helper.html`
4. **Run fix script** - Use `node scripts/fix-electron-auth.js`

### **Common Solutions:**
- Restart the backend: `pnpm dev`
- Clear browser cache and cookies
- Check Google Cloud Console configuration
- Verify environment variables

---

## **🎉 Expected Results**

After applying this fix:

✅ **Electron app authentication works properly**
✅ **No more "invalid_client" or "invalid_grant" errors**
✅ **Seamless Google OAuth integration**
✅ **Automatic token refresh**
✅ **Integration with analytics platform**
✅ **Real-time email data sync**

Your Taskforce Mailer Electron app should now work perfectly with the new analytics platform!

---

**🚀 Ready to fix your authentication? Start with the OAuth Helper tool at `http://localhost:3000/oauth-helper.html`**
