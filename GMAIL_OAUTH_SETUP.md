# Gmail OAuth Setup Guide

This guide will help you set up Gmail OAuth integration for the Taskforce Analytics Platform.

## 🔧 Prerequisites

- Google Cloud Console access
- PostgreSQL database running
- Node.js and pnpm installed

## 📋 Step 1: Google Cloud Console Configuration

### 1.1 Navigate to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `taskforce-mailer-v2`

### 1.2 Enable Required APIs
1. Go to **APIs & Services** > **Library**
2. Search and enable these APIs:
   - **Gmail API** ✅ (already enabled)
   - **Google People API** (for user information) - *Optional, for enhanced user profiles*

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure it's configured for **External** users
3. Add these scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.metadata
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```
4. Add test users if needed

### 1.4 Update OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add these **Authorized redirect URIs**:
   ```
   http://localhost:4000/auth/google/callback
   http://localhost:3000/auth/callback
   ```

## 📋 Step 2: Environment Configuration

### 2.1 Create Environment File
```bash
cp env.example .env
```

### 2.2 Verify Settings
Make sure your `.env` file contains:
```bash
# Gmail OAuth
GMAIL_CLIENT_ID="1007595181381-n1ildiigmoupnn78n8ekkhlulsfigbfk.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="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"
GMAIL_REDIRECT_URI="http://localhost:4000/auth/google/callback"
FRONTEND_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://postgres:Rayvical@localhost:5432/TASKFORCE"

# AI Configuration
OPENROUTER_API_KEY="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"
OPENROUTER_MODEL="nvidia/nemotron-nano-9b-v2:free"
CONSENT_CONTENT=true
```

## 📋 Step 3: Database Setup

### 3.1 Create Database
```bash
createdb TASKFORCE
```

### 3.2 Run Migrations
```bash
pnpm --filter backend prisma migrate dev --name init
```

### 3.3 Seed Demo Data
```bash
pnpm --filter backend prisma db seed
```

## 📋 Step 4: Start the Application

### 4.1 Install Dependencies
```bash
pnpm install
```

### 4.2 Start All Services
```bash
pnpm dev
```

This will start:
- **Backend API**: http://localhost:4000
- **AI Service**: http://localhost:4001
- **Frontend**: http://localhost:3000

## 🚀 Testing the Integration

### 4.1 Access the Application
1. Open http://localhost:3000
2. You'll be redirected to the login page

### 4.2 Connect Gmail
1. Click **"Continue with Gmail"**
2. You'll be redirected to Google OAuth
3. Sign in with your Google account
4. Grant permissions for Gmail access
5. You'll be redirected back to the dashboard

### 4.3 Test Gmail Connection
1. Go to http://localhost:4000/auth/test-gmail
2. You should see your Gmail profile information

## 🔍 Troubleshooting

### Common Issues

#### 1. "redirect_uri_mismatch" Error
- Make sure you've added the correct redirect URIs in Google Cloud Console
- Check that `GMAIL_REDIRECT_URI` matches exactly

#### 2. "access_denied" Error
- Make sure you've granted all required permissions
- Check that the OAuth consent screen is properly configured

#### 3. Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check that the database exists

#### 4. API Quotas Exceeded
- Gmail API has daily quotas
- For development, you can request quota increases

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

Check logs in the terminal for detailed error information.

## 📊 What Happens After OAuth

Once you successfully connect Gmail:

1. **User Account Created**: Your Google account is linked to the system
2. **Mailbox Added**: Your Gmail account is added as a mailbox
3. **Data Sync Starts**: Background workers begin syncing your email metadata
4. **Analytics Available**: Real-time analytics start appearing in the dashboard
5. **AI Processing**: AI analysis begins on your emails (with consent)

## 🔐 Security Notes

- OAuth tokens are stored securely in the database
- Only email metadata is collected (not email content unless consent is given)
- All data is encrypted in transit and at rest
- Tokens are automatically refreshed when needed

## 🎯 Next Steps

After successful OAuth setup:

1. **Explore Analytics**: Check out the dashboard with your real data
2. **Try AI Features**: Use the AI console to ask questions about your emails
3. **Configure Teams**: Set up team members and permissions
4. **Customize Reports**: Create custom analytics reports
5. **Set Up Automation**: Configure automated workflows

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the application logs
3. Verify all environment variables are set correctly
4. Ensure all services are running properly

---

**🎉 Congratulations!** You now have a fully functional Gmail OAuth integration with the Taskforce Analytics Platform!
