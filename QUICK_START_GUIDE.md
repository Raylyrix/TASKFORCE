# 🚀 Taskforce Mailer - Quick Start Guide

## **Get Started in 5 Minutes!**

### **Step 1: Start the Application**
```bash
# Start all services
pnpm dev

# Or start individually:
pnpm --filter @taskforce/backend dev
pnpm --filter @taskforce/frontend dev
pnpm --filter @taskforce/ai-service dev
pnpm --filter @taskforce/worker dev
```

### **Step 2: Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **AI Service**: http://localhost:4001

### **Step 3: Connect Your Email**
1. Click **"Connect Gmail"** or **"Connect Outlook"**
2. Complete OAuth flow
3. Grant necessary permissions
4. Your emails will start syncing automatically!

---

## 🎯 **Essential Features to Try First**

### **1. Dashboard Overview**
- View your email metrics at a glance
- See sent/received counts
- Check your average response time
- Monitor your top contacts

### **2. AI Console (Try These Queries)**
```
"What's my busiest day this week?"
"Show me contacts I haven't replied to recently"
"Which emails took me longest to respond to?"
"Summarize my communication patterns"
```

### **3. Advanced AI Dashboard**
- **Sentiment Tab**: See relationship health scores
- **Monitoring Tab**: View real-time alerts
- **Predictions Tab**: Check email volume forecasts

### **4. Generate Your First Report**
1. Go to Reports section
2. Click "Generate Report"
3. Select "Weekly Summary"
4. Download as PDF

---

## 🔧 **Quick Configuration**

### **Enable AI Features**
Add to your `.env` file:
```bash
CONSENT_CONTENT=true
OPENROUTER_API_KEY=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
```

### **Database Setup**
```bash
# Run migrations
pnpm --filter @taskforce/backend prisma migrate dev

# Seed demo data
pnpm --filter @taskforce/backend prisma db seed
```

---

## 📊 **What You'll See**

### **Main Dashboard**
- **Metrics Cards**: Key performance indicators
- **Volume Chart**: Email trends over time
- **Response Time Chart**: Your responsiveness patterns
- **Top Contacts**: Your most frequent contacts
- **AI Console**: Ask questions about your email

### **AI Features**
- **Natural Language Queries**: Ask questions in plain English
- **Smart Summaries**: AI-generated thread summaries
- **Sentiment Analysis**: Understand communication tone
- **Predictive Analytics**: Forecast email workload
- **Real-time Monitoring**: Get alerts for important emails

### **Reports**
- **Automated Reports**: Weekly/monthly summaries
- **Custom Reports**: Generate reports for any date range
- **AI Insights**: Get recommendations for improvement
- **Multiple Formats**: PDF, Excel, CSV exports

---

## 🎯 **Pro Tips for Immediate Value**

### **Ask These AI Questions Daily**
- "What emails need my attention today?"
- "Which clients haven't I contacted recently?"
- "What's my response time trend this week?"

### **Set Up Automated Reports**
- Weekly summary every Monday
- Monthly analytics report
- Client health reports for account managers

### **Monitor These Metrics**
- Response time (aim for <24 hours)
- Contact health scores (keep above 80%)
- Email volume trends (watch for spikes)
- VIP contact responsiveness (100% response rate)

---

## 🚨 **Troubleshooting**

### **If Emails Aren't Syncing**
1. Check OAuth connection status
2. Verify environment variables
3. Check Redis connection for background jobs

### **If AI Features Don't Work**
1. Verify `CONSENT_CONTENT=true`
2. Check OpenRouter API key
3. Ensure backend services are running

### **If Reports Won't Generate**
1. Check file system permissions
2. Verify SMTP settings
3. Ensure sufficient disk space

---

## 📞 **Need Help?**

1. **Check the Full User Guide**: `USER_GUIDE.md`
2. **API Documentation**: Available at `/api/docs` when running
3. **Logs**: Check console output for error messages
4. **Health Check**: Visit `/health` endpoint

---

**🎉 You're Ready to Transform Your Email Productivity!**

Start with the dashboard overview, try some AI queries, and generate your first report. The more you use it, the smarter it gets!
