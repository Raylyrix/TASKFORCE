# 📧 Taskforce Mailer - Complete User Guide

## 🚀 **Getting Started**

### **What is Taskforce Mailer?**
Taskforce Mailer is a world-class professional email intelligence and productivity platform that transforms your email into actionable insights. It's like having an AI assistant that understands your email patterns, predicts your workload, and helps you communicate more effectively.

---

## 🔐 **1. AUTHENTICATION & SETUP**

### **Connecting Your Email Accounts**

#### **Option A: Web Application (Recommended)**
1. **Start the Application**
   - Navigate to `http://localhost:3000` (Frontend)
   - Backend runs on `http://localhost:4000`

2. **Connect Gmail Account**
   - Click "Connect Gmail" button
   - You'll be redirected to Google OAuth
   - Grant permissions for:
     - Read Gmail messages
     - Access email metadata
     - View your profile information

3. **Connect Outlook Account**
   - Click "Connect Outlook" button
   - Complete Microsoft OAuth flow
   - Grant similar permissions

#### **Option B: Desktop Application (Electron)**
1. **For Existing Electron App Users**
   - Use the Electron Bridge endpoints
   - Navigate to `/auth/electron/authorize`
   - Copy the authorization code
   - Use `/auth/electron/token-exchange` with the code

### **Environment Setup**
Make sure these environment variables are configured:
```bash
# Gmail OAuth
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:4000/auth/google/callback

# Database
DATABASE_URL=postgresql://postgres:Rayvical@localhost:5432/TASKFORCE

# Redis (for background jobs)
REDIS_URL=redis://localhost:6379

# AI Features
OPENROUTER_API_KEY=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
CONSENT_CONTENT=true
```

---

## 📊 **2. MAIN DASHBOARD FEATURES**

### **Overview Dashboard**
The main dashboard provides a comprehensive view of your email analytics:

#### **📈 Key Metrics Cards**
- **Emails Sent/Received**: Daily, weekly, monthly counts
- **Average Response Time**: How quickly you respond to emails
- **Top Contact**: Your most frequent communication partner
- **Health Score**: Overall email communication health

#### **📊 Interactive Charts**
1. **Volume Chart**: Email volume over time (line chart)
2. **Response Time Chart**: Distribution of response times (bar chart)
3. **Contact Health Chart**: Health scores of your contacts (pie chart)

#### **🎯 Top Contacts Section**
- Lists your most frequent contacts
- Shows communication frequency
- Displays response rates
- Click any contact for detailed analytics

#### **⚡ Recent Activity Feed**
- Real-time updates of email activity
- Shows recent sent/received emails
- Displays important notifications

---

## 🤖 **3. ADVANCED AI FEATURES**

### **AI Insights Console**
Located in the main dashboard, this powerful tool lets you ask questions in natural language:

#### **Example Queries You Can Ask:**
```
"Show me clients with response delays over 3 days"
"Summarize all finance-related emails this week"
"What's my busiest day of the week?"
"Which contacts haven't I replied to recently?"
"Show me emails from VIP clients"
"Analyze my communication patterns"
```

#### **How to Use:**
1. Type your question in the AI Console
2. Press Enter or click "Ask AI"
3. Get instant insights with data and charts
4. Click on generated charts for more details

### **Advanced AI Dashboard**
A comprehensive AI-powered analytics section with three main tabs:

#### **💝 Sentiment & Relationships Tab**
- **Relationship Health Tracking**: Monitor the health of your professional relationships
- **Sentiment Analysis**: Understand the emotional tone of conversations
- **Crisis Detection**: Get alerts when relationships need attention
- **Team Stress Monitoring**: Track team communication stress levels

#### **🔔 Real-time Monitoring Tab**
- **Smart Alerts**: Get notified about important emails
- **VIP Email Detection**: Never miss emails from important contacts
- **Pattern Recognition**: AI detects unusual communication patterns
- **Active Alerts Dashboard**: See all current alerts and their priorities

#### **📈 Predictive Analytics Tab**
- **Email Volume Forecasting**: Predict future email load
- **Response Time Prediction**: Estimate how long responses will take
- **Workload Prediction**: Forecast your email workload
- **Capacity Planning**: Optimize your schedule based on predictions

---

## 📧 **4. EMAIL ANALYTICS FEATURES**

### **Volume Analytics**
Track your email communication patterns:
- **Daily/Weekly/Monthly Trends**: See how your email volume changes over time
- **Peak Hours Analysis**: Identify your busiest communication times
- **Seasonal Patterns**: Understand long-term trends

### **Response Time Analytics**
Measure your responsiveness:
- **Average Response Time**: Overall responsiveness metric
- **Response Time Distribution**: See the range of your response times
- **Fastest/Slowest Responses**: Track your best and worst response times
- **Contact-Specific Response Times**: See how quickly you respond to different people

### **Contact Health Analytics**
Monitor relationship quality:
- **Health Scores**: AI-calculated health scores for each contact
- **Communication Frequency**: How often you communicate with each contact
- **Response Rate Tracking**: Percentage of emails you respond to
- **One-sided Communication Detection**: Identify contacts you might be neglecting

### **Thread Analysis**
Understand conversation patterns:
- **Thread Length Analysis**: Average length of email conversations
- **Longest Chains**: Identify your most complex conversations
- **Thread Health**: Monitor the health of ongoing conversations

---

## 📋 **5. REPORTING & EXPORTS**

### **Report Generator**
Create comprehensive reports of your email analytics:

#### **Available Report Types:**
1. **Weekly Summary Report**
2. **Monthly Analytics Report**
3. **Custom Date Range Report**
4. **Team Performance Report**
5. **Client Health Report**

#### **Report Formats:**
- **PDF**: Professional formatted reports
- **Excel**: Spreadsheet with raw data
- **CSV**: Data for external analysis

#### **Report Contents:**
- Executive summary with AI insights
- Charts and visualizations
- Key performance indicators
- Recommendations for improvement
- Detailed analytics breakdown

### **Scheduled Reports**
Set up automatic report generation:
1. **Choose Report Type**: Select from available templates
2. **Set Schedule**: Daily, weekly, monthly, or custom
3. **Select Recipients**: Who should receive the reports
4. **Configure Format**: PDF, Excel, or CSV
5. **Enable AI Insights**: Include AI-generated recommendations

### **How to Generate Reports:**
1. Navigate to the Reports section
2. Click "Generate Report"
3. Select your preferences:
   - Date range
   - Report type
   - Include AI insights (yes/no)
   - Format (PDF/Excel/CSV)
4. Click "Generate"
5. Download or email the report

---

## 🔄 **6. BACKGROUND PROCESSING**

### **Automatic Data Sync**
The system automatically:
- **Syncs Email Data**: Every hour, new emails are imported
- **Calculates Analytics**: Background jobs compute your metrics
- **Updates AI Models**: Machine learning models are continuously improved
- **Processes Webhooks**: Real-time updates from Gmail/Outlook

### **Queue Management**
- **Ingestion Queue**: Handles email data import
- **Analytics Queue**: Processes analytics calculations
- **AI Queue**: Manages AI analysis jobs
- **Report Queue**: Handles report generation

---

## 🎛️ **7. API ENDPOINTS**

### **Analytics Endpoints**
```
GET /api/v1/analytics/overview - Get dashboard overview
GET /api/v1/analytics/volume - Get volume data
GET /api/v1/analytics/response-times - Get response time metrics
GET /api/v1/analytics/contacts - Get contact analytics
GET /api/v1/analytics/threads - Get thread analysis
```

### **AI Endpoints**
```
POST /api/v1/ai/query - Natural language queries
POST /api/v1/ai/summarize - Summarize email threads
POST /api/v1/ai/analyze - Analyze specific emails
POST /api/v1/ai/draft - Generate smart replies
```

### **Authentication Endpoints**
```
GET /auth/google - Start Gmail OAuth
GET /auth/google/callback - Gmail OAuth callback
GET /auth/microsoft - Start Outlook OAuth
GET /auth/microsoft/callback - Outlook OAuth callback
```

---

## 🔧 **8. ADVANCED CONFIGURATION**

### **AI Model Configuration**
The system uses OpenRouter with the `nvidia/nemotron-nano-9b-v2:free` model:
- **Cost-effective**: Free tier available
- **High Performance**: Optimized for email analysis
- **Multilingual**: Supports multiple languages
- **Context-aware**: Understands email context

### **Database Schema**
Multi-tenant PostgreSQL database with:
- **User Management**: Individual user accounts
- **Organization Support**: Multi-tenant architecture
- **Mailbox Integration**: Connected email accounts
- **Analytics Storage**: Historical data and aggregates
- **AI Request Logging**: Track AI usage and costs

### **Security Features**
- **OAuth2 Authentication**: Secure email account access
- **JWT Tokens**: Secure API authentication
- **Data Encryption**: Encrypted storage of sensitive data
- **Consent Management**: GDPR/CCPA compliant
- **Audit Logging**: Track all system access

---

## 🚨 **9. TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **Authentication Problems**
**Issue**: Can't connect Gmail/Outlook
**Solution**: 
1. Check OAuth credentials in environment variables
2. Ensure redirect URIs are correctly configured
3. Verify API permissions in Google/Microsoft consoles

#### **AI Features Not Working**
**Issue**: AI queries return errors
**Solution**:
1. Verify `OPENROUTER_API_KEY` is set
2. Check `CONSENT_CONTENT=true` in environment
3. Ensure API quota hasn't been exceeded

#### **Data Not Syncing**
**Issue**: New emails not appearing
**Solution**:
1. Check Redis connection for background jobs
2. Verify webhook endpoints are accessible
3. Check mailbox connection status

#### **Reports Not Generating**
**Issue**: Report generation fails
**Solution**:
1. Check file system permissions
2. Verify SMTP settings for email reports
3. Ensure sufficient disk space

### **Performance Optimization**
- **Database Indexing**: Optimized for common queries
- **Caching**: Redis caching for frequently accessed data
- **Background Processing**: Non-blocking operations
- **Pagination**: Large datasets are paginated

---

## 📱 **10. MOBILE & DESKTOP ACCESS**

### **Web Application**
- **Responsive Design**: Works on all devices
- **Progressive Web App**: Can be installed on mobile
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Basic functionality without internet

### **Desktop Integration**
- **Electron Bridge**: Connect existing desktop apps
- **API Access**: Full API available for custom integrations
- **Webhook Support**: Real-time notifications
- **Local Data Sync**: Synchronize with local databases

---

## 🎯 **11. BEST PRACTICES**

### **Getting the Most Out of Taskforce Mailer**

#### **Daily Workflow**
1. **Morning**: Check dashboard for overnight activity
2. **Review Alerts**: Address any VIP or urgent emails
3. **Use AI Insights**: Ask questions about your email patterns
4. **Monitor Health Scores**: Keep relationships healthy

#### **Weekly Tasks**
1. **Generate Reports**: Create weekly analytics reports
2. **Review Trends**: Analyze weekly communication patterns
3. **Update Contacts**: Ensure contact information is current
4. **Check AI Recommendations**: Implement suggested improvements

#### **Monthly Reviews**
1. **Comprehensive Reports**: Generate detailed monthly reports
2. **Performance Analysis**: Review key metrics and trends
3. **Relationship Health**: Assess and improve contact relationships
4. **System Optimization**: Review and optimize settings

### **AI Query Tips**
- **Be Specific**: "Show me emails from John Smith last week" vs "Show me some emails"
- **Use Time References**: "This month", "last week", "yesterday"
- **Ask for Comparisons**: "Compare my response times this month vs last month"
- **Request Insights**: "What patterns do you see in my communication?"

---

## 🆘 **12. SUPPORT & HELP**

### **Getting Help**
1. **Check Documentation**: This guide and inline help
2. **Review Logs**: Check application logs for errors
3. **Test Endpoints**: Use API endpoints directly for debugging
4. **Contact Support**: Reach out for technical assistance

### **Development & Customization**
- **API Documentation**: Full API reference available
- **Webhook Integration**: Connect external systems
- **Custom Analytics**: Build custom metrics
- **AI Model Training**: Train custom models for specific use cases

---

## 🎉 **CONCLUSION**

Taskforce Mailer transforms your email from a simple communication tool into a powerful business intelligence platform. With AI-powered insights, comprehensive analytics, and predictive capabilities, you'll never miss important communications and can optimize your email productivity like never before.

**Start exploring the features today and unlock the full potential of your email communication!** 🚀

---

*For technical support or feature requests, please refer to the API documentation or contact the development team.*
