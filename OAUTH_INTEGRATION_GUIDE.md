# Gmail OAuth Integration Guide

## 🎉 Complete OAuth Integration Ready!

Your Taskforce Analytics platform now has full Gmail OAuth integration with the updated web application credentials.

### **🔑 Updated OAuth Credentials**

```json
{
  "web": {
    "client_id": "1007595181381-dd7o4v4jh01b1pcar6a681hj6pmjdsnp.apps.googleusercontent.com",
    "project_id": "taskforce-mailer-v2",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "client_secret": "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",
    "redirect_uris": [
      "http://localhost:4000/auth/google/callback",
      "http://localhost:3000/auth/callback"
    ]
  }
}
```

### **🚀 Quick Start**

#### **Option 1: Quick Start Script (Windows)**
```bash
scripts\quick-start.bat
```

#### **Option 2: Manual Setup**
```bash
# Install dependencies
pnpm install

# Build application
pnpm build

# Start all services
pnpm dev
```

#### **Option 3: Docker Deployment**
```bash
# Build and start with Docker
pnpm docker:build
pnpm docker:up
```

### **🔗 OAuth Flow**

1. **User visits**: http://localhost:3000
2. **Redirected to login** if not authenticated
3. **Clicks "Continue with Gmail"**
4. **Redirected to Google OAuth** with your credentials
5. **Grants permissions** for Gmail access
6. **Redirected back** with authentication token
7. **Dashboard loads** with real Gmail data

### **🧪 Testing the Integration**

#### **Run OAuth Integration Test**
```bash
node scripts/test-oauth-integration.js
```

This will test:
- ✅ Environment configuration
- ✅ Backend health
- ✅ Frontend health
- ✅ OAuth endpoints
- ✅ Redirect functionality
- ✅ Analytics endpoints
- ✅ AI service
- ✅ OAuth URL generation

#### **Manual OAuth Test URL**
The test script will generate a direct OAuth URL you can use for testing:

```
https://accounts.google.com/o/oauth2/auth?client_id=1007595181381-dd7o4v4jh01b1pcar6a681hj6pmjdsnp.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fauth%2Fgoogle%2Fcallback&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.metadata%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&response_type=code&access_type=offline&prompt=consent&state=test-taskforce-analytics
```

### **📊 What Happens After OAuth**

Once you successfully connect Gmail:

1. **User Account Created** - Your Google profile becomes a user account
2. **Mailbox Linked** - Your Gmail account is connected to the system
3. **Background Sync Starts** - Email metadata begins syncing
4. **AI Analysis Begins** - Priority prediction and sentiment analysis
5. **Real-time Analytics** - Live dashboards with your data
6. **Interactive Features** - AI console and smart insights

### **🔧 API Endpoints**

#### **Authentication**
- `GET /auth/google` - Initiate Gmail OAuth
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout user
- `GET /auth/test-gmail` - Test Gmail connection

#### **Analytics (Protected)**
- `GET /api/v1/analytics/overview` - Dashboard overview
- `GET /api/v1/analytics/volume` - Email volume data
- `GET /api/v1/analytics/response-times` - Response time metrics
- `GET /api/v1/analytics/contacts` - Contact health data
- `GET /api/v1/analytics/threads` - Thread analysis

#### **AI Features (Protected)**
- `POST /api/v1/ai/query` - Natural language queries
- `POST /api/v1/ai/summarize` - Thread summarization
- `POST /api/v1/ai/analyze` - Message analysis
- `POST /api/v1/ai/draft` - Smart reply generation

### **🏗️ Infrastructure**

#### **CI/CD Pipeline**
- ✅ **GitHub Actions** - Automated testing and deployment
- ✅ **Multi-environment** - Staging and production support
- ✅ **Security scanning** - Vulnerability detection
- ✅ **Docker support** - Container deployment

#### **Deployment Options**
- ✅ **Development** - `pnpm dev`
- ✅ **Production** - `pnpm deploy:production`
- ✅ **Docker** - `pnpm docker:up`
- ✅ **PM2** - Process management

### **🔒 Security Features**

- 🔐 **OAuth 2.0** - Industry-standard authentication
- 🛡️ **JWT Tokens** - Secure session management
- 🔒 **HTTPS Ready** - TLS encryption support
- 🚫 **Content Consent** - User-controlled AI analysis
- 🔍 **Audit Logging** - Comprehensive access tracking

### **📋 Environment Variables**

Make sure your `.env` file contains:

```bash
# Gmail OAuth (Updated Credentials)
GMAIL_CLIENT_ID="1007595181381-dd7o4v4jh01b1pcar6a681hj6pmjdsnp.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="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"
GMAIL_REDIRECT_URI="http://localhost:4000/auth/google/callback"
FRONTEND_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://postgres:Rayvical@localhost:5432/TASKFORCE"

# AI Configuration
OPENROUTER_API_KEY="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"
OPENROUTER_MODEL="nvidia/nemotron-nano-9b-v2:free"
CONSENT_CONTENT=false
```

### **🐛 Troubleshooting**

#### **Common Issues**

1. **"redirect_uri_mismatch" Error**
   - Verify redirect URIs in Google Cloud Console
   - Check that `GMAIL_REDIRECT_URI` matches exactly

2. **"access_denied" Error**
   - Ensure all required scopes are granted
   - Check OAuth consent screen configuration

3. **Backend Not Starting**
   - Run `pnpm install` and `pnpm build`
   - Check PostgreSQL is running
   - Verify environment variables

4. **Frontend Not Loading**
   - Ensure backend is running on port 4000
   - Check for console errors
   - Verify Next.js build

#### **Debug Commands**
```bash
# Check environment
node scripts/check-env.js

# Test OAuth integration
node scripts/test-oauth-integration.js

# View logs
pnpm docker:logs

# Restart services
pnpm docker:down && pnpm docker:up
```

### **🎯 Next Steps**

After successful OAuth setup:

1. **Explore Analytics** - Check out the dashboard with real data
2. **Try AI Features** - Use the AI console for insights
3. **Configure Teams** - Set up team members and permissions
4. **Customize Reports** - Create custom analytics reports
5. **Set Up Automation** - Configure automated workflows

### **📞 Support**

If you encounter issues:

1. Run the OAuth integration test
2. Check the troubleshooting section
3. Review application logs
4. Verify all environment variables

---

**🎉 Your Gmail OAuth integration is ready for testing!**

*Visit http://localhost:3000 and click "Continue with Gmail" to start exploring your email analytics.*
