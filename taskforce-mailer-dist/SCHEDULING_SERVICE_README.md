# 📧 Taskforce Mailer - Email Scheduling Service

A robust, enterprise-grade email scheduling service built with Supabase, BullMQ, and Redis that ensures emails are sent even when your PC is shut down.

## 🚀 Features

### Core Functionality
- **Persistent Scheduling**: Emails are stored in Supabase and survive server restarts
- **Reliable Delivery**: BullMQ with Redis ensures job persistence and retry logic
- **Offline Resilience**: Emails continue processing even when client is offline
- **Retry Logic**: Exponential backoff with configurable max retries
- **Audit Trail**: Complete logging of all email operations

### Enterprise Features
- **Multi-region Support**: Deploy across multiple regions for high availability
- **Dead Letter Queue**: Failed emails are queued for manual review
- **Audit Logging**: Complete compliance-ready audit trail
- **Webhook Notifications**: Real-time status updates via webhooks
- **Security**: End-to-end encryption and JWT authentication

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Backend API   │    │  Email Worker   │
│                 │    │                 │    │                 │
│  Schedule Email │───▶│  Store in DB    │───▶│  Process Jobs   │
│  Check Status   │◀───│  Queue Job      │◀───│  Send Email     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Supabase DB   │    │   Redis Queue   │
                       │                 │    │                 │
                       │  Email Storage  │    │  Job Queue      │
                       │  Audit Logs     │    │  Retry Logic    │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# Supabase
SUPABASE_URL="https://mcyiohpzduyqmjsepedo.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_SECURE="false"
SMTP_FROM_NAME="Taskforce Mailer"

# Redis for BullMQ
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Encryption
ENCRYPTION_KEY="your-encryption-key"
```

### 2. Database Setup

Run the Supabase schema:

```sql
-- Execute supabase-schema.sql in your Supabase SQL editor
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Start Services

```bash
# Start Redis
redis-server

# Start Backend
pnpm --filter @taskforce/backend dev

# Start Email Worker (in separate terminal)
node apps/backend/src/workers/email-worker.js
```

## 📚 API Endpoints

### Schedule Email
```http
POST /api/v1/schedule-mail
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "recipients": ["user@example.com"],
  "subject": "Scheduled Email",
  "body": "Email content",
  "html_body": "<h1>Email content</h1>",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "max_retries": 3,
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64-content",
      "contentType": "application/pdf"
    }
  ],
  "metadata": {
    "campaign_id": "campaign-123"
  }
}
```

### Check Email Status
```http
GET /api/v1/status/{email-id}
Authorization: Bearer <jwt-token>
```

### Cancel Email
```http
DELETE /api/v1/cancel/{email-id}
Authorization: Bearer <jwt-token>
```

### List Scheduled Emails
```http
GET /api/v1/scheduled-emails?status=pending&limit=20&offset=0
Authorization: Bearer <jwt-token>
```

### Test Email
```http
POST /api/v1/test-email
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "to": "test@example.com"
}
```

## 🧪 Testing

### Manual Test
```bash
node test-scheduling.js
```

This will:
1. Schedule an email for 2 minutes from now
2. Show you can shut down the client
3. The backend will still send the email
4. Monitor the status until completion

### Test Scenarios

1. **Basic Scheduling**: Schedule email, verify it's queued
2. **Offline Resilience**: Schedule email, shut down client, verify delivery
3. **Retry Logic**: Simulate SMTP failure, verify retry attempts
4. **Cancellation**: Schedule email, cancel before sending
5. **Audit Trail**: Check logs for compliance

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# Scale email workers
docker-compose -f docker-compose.production.yml up -d --scale email-worker=3
```

### Environment File
Create `.env.production`:
```env
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-jwt-secret
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
ENCRYPTION_KEY=your-encryption-key
```

## 📊 Monitoring

### Queue Statistics
```http
GET /api/v1/queue-stats
```

Returns:
```json
{
  "success": true,
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3
  }
}
```

### Health Checks
- Backend: `GET /health`
- Redis: `redis-cli ping`
- Database: `pg_isready`

## 🔒 Security

### Data Encryption
- All sensitive data encrypted at rest
- TLS in transit
- JWT authentication required
- Row-level security in Supabase

### Access Control
- User can only access their own emails
- Admin endpoints require admin role
- API rate limiting (configurable)

## 🚨 Error Handling

### Retry Logic
- Exponential backoff: 2^n minutes
- Max retries: 3 (configurable)
- Dead letter queue for failed emails
- Detailed error logging

### Monitoring
- Real-time status updates
- Webhook notifications
- Audit trail for compliance
- Performance metrics

## 📈 Scaling

### Horizontal Scaling
- Multiple email workers
- Load balancer for API
- Redis cluster for high availability
- Database read replicas

### Performance Tuning
- Connection pooling
- Batch processing
- Rate limiting
- Memory optimization

## 🔧 Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP credentials
   - Verify Redis connection
   - Check worker logs

2. **Jobs stuck in queue**
   - Restart Redis
   - Check worker status
   - Review error logs

3. **Database connection issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review connection pool settings

### Logs
```bash
# Backend logs
docker-compose logs backend

# Email worker logs
docker-compose logs email-worker

# Redis logs
docker-compose logs redis
```

## 🎯 Use Cases

### Marketing Campaigns
- Schedule promotional emails
- Send follow-up sequences
- Birthday/anniversary emails

### Business Operations
- Invoice reminders
- Meeting confirmations
- Report deliveries

### Customer Support
- Welcome emails
- Password resets
- Status updates

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide
