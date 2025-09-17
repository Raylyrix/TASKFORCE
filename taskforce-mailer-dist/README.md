# Taskforce Mailer - Complete Distribution Package

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js v18+**: Download from https://nodejs.org/
2. **pnpm**: Run `npm install -g pnpm`
3. **Redis**: Download from https://redis.io/download
4. **Supabase Account**: Sign up at https://supabase.com

### Setup Instructions

1. **Extract and Navigate:**
   ```bash
   # Extract this package to your desired location
   cd taskforce-mailer-dist
   ```

2. **Configure Environment:**
   ```bash
   # Copy environment template
   copy env.example .env
   
   # Edit .env with your settings:
   # - SMTP credentials for email sending
   # - Supabase URL and keys
   # - Redis connection details
   # - JWT secret for authentication
   ```

3. **Setup Supabase Database:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the SQL to create tables

4. **Install Dependencies:**
   ```bash
   pnpm install
   ```

5. **Start the Application:**
   ```bash
   # Windows
   start.bat
   
   # Or manually
   node start-app.js
   ```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 📧 Email Scheduling Features

### Core Features
- ✅ **Schedule emails for future delivery**
- ✅ **Offline resilience** - emails sent even if PC is shut down
- ✅ **Retry logic** with exponential backoff
- ✅ **Audit trail** for compliance
- ✅ **Supabase integration** for data persistence
- ✅ **Real-time status tracking**

### API Endpoints
- `POST /api/v1/schedule-mail` - Schedule an email
- `GET /api/v1/status/:id` - Check email status
- `DELETE /api/v1/cancel/:id` - Cancel scheduled email
- `GET /api/v1/scheduled-emails` - List your emails
- `POST /api/v1/test-email` - Send test email

### Example Usage
```javascript
// Schedule an email
const response = await fetch('http://localhost:4000/api/v1/schedule-mail', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    recipients: ['user@example.com'],
    subject: 'Scheduled Email',
    body: 'This will be sent even if your PC is off!',
    scheduled_at: '2024-01-15T10:00:00Z',
    max_retries: 3
  })
});
```

## 🔧 Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskforce"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# SMTP (for email sending)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

## 🐳 Docker Deployment

For production deployment:
```bash
docker-compose -f docker-compose.production.yml up -d
```

## 🧪 Testing

### Test Email Scheduling
```bash
node test-scheduling.js
```

This will:
1. Schedule an email for 2 minutes from now
2. Show you can shut down the client
3. The backend will still send the email
4. Monitor the status until completion

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use:**
   - Kill processes using ports 3000, 4000, 4001
   - Or change ports in .env file

2. **Redis connection failed:**
   - Ensure Redis is running
   - Check REDIS_URL in .env

3. **Supabase connection failed:**
   - Verify SUPABASE_URL and keys
   - Check if tables exist in Supabase

4. **SMTP errors:**
   - Verify SMTP credentials
   - Use app-specific passwords for Gmail

### Logs
Check the terminal output for detailed error messages and logs.

## 📚 Documentation

- **API Documentation**: See `SCHEDULING_SERVICE_README.md`
- **Database Schema**: See `supabase-schema.sql`
- **Docker Setup**: See `docker-compose.production.yml`

## 🎯 Features Overview

### Email Scheduling
- Schedule emails for any future date/time
- Offline resilience - works even when PC is off
- Automatic retry with exponential backoff
- Complete audit trail for compliance

### Enterprise Features
- Multi-region deployment support
- Dead letter queue for failed emails
- Webhook notifications
- Role-based access control
- Data encryption at rest

### Monitoring & Analytics
- Real-time queue statistics
- Email delivery tracking
- Performance metrics
- Health checks

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs in the terminal
3. Verify all prerequisites are installed
4. Ensure Redis and Supabase are properly configured

---

**Taskforce Mailer v4.0** - Enterprise Email Scheduling Solution
