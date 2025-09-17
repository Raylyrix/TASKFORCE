-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VIEWER', 'ANALYST', 'MANAGER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('MEMBER', 'LEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('GMAIL', 'OUTLOOK', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('FROM', 'TO', 'CC', 'BCC');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('PRIORITY', 'SENTIMENT', 'SUMMARY', 'TASK_EXTRACTION', 'CATEGORIZATION', 'SMART_REPLY');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "EventTypeType" AS ENUM ('ONE_ON_ONE', 'GROUP', 'ROUND_ROBIN', 'COLLECTIVE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'SELECT', 'MULTISELECT', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'TIME', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'OUTLOOK', 'APPLE', 'CALDAV');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailboxes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" "EmailProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncCursor" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT,

    CONSTRAINT "mailboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "subject" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmails" TEXT[],
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "size" INTEGER,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "attachmentCount" INTEGER DEFAULT 0,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "snippet" TEXT,
    "bodyHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mailboxId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threads" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 1,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mailboxId" TEXT NOT NULL,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "domain" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "responseRate" DOUBLE PRECISION,
    "avgResponseTime" INTEGER,
    "lastContactAt" TIMESTAMP(3),
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mailboxId" TEXT NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_contacts" (
    "id" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL DEFAULT 'TO',
    "messageId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "message_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_aggregates" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "analytics_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "analysisType" "AnalysisType" NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "model" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_requests" (
    "id" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "cost" DOUBLE PRECISION,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "template" TEXT,
    "data" JSONB NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "generatedById" TEXT NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL,
    "type" "EventTypeType" NOT NULL DEFAULT 'ONE_ON_ONE',
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "maxBookings" INTEGER,
    "price" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventTypeId" TEXT NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "attendeeName" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "meetingLink" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "confirmationCode" TEXT,
    "rescheduledFrom" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "attendeeId" TEXT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'TEXT',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "placeholder" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventTypeId" TEXT NOT NULL,

    CONSTRAINT "booking_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_responses" (
    "id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "booking_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "calendarId" TEXT NOT NULL,
    "calendarName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncToken" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "team_memberships_userId_teamId_key" ON "team_memberships"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "mailboxes_email_organizationId_key" ON "mailboxes"("email", "organizationId");

-- CreateIndex
CREATE INDEX "messages_receivedAt_idx" ON "messages"("receivedAt");

-- CreateIndex
CREATE INDEX "messages_fromEmail_idx" ON "messages"("fromEmail");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_messageId_mailboxId_key" ON "messages"("messageId", "mailboxId");

-- CreateIndex
CREATE INDEX "threads_lastMessageAt_idx" ON "threads"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "threads_threadId_mailboxId_key" ON "threads"("threadId", "mailboxId");

-- CreateIndex
CREATE INDEX "contacts_domain_idx" ON "contacts"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_mailboxId_key" ON "contacts"("email", "mailboxId");

-- CreateIndex
CREATE UNIQUE INDEX "message_contacts_messageId_contactId_role_key" ON "message_contacts"("messageId", "contactId", "role");

-- CreateIndex
CREATE INDEX "analytics_aggregates_date_idx" ON "analytics_aggregates"("date");

-- CreateIndex
CREATE INDEX "analytics_aggregates_metric_idx" ON "analytics_aggregates"("metric");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_aggregates_organizationId_date_metric_key" ON "analytics_aggregates"("organizationId", "date", "metric");

-- CreateIndex
CREATE INDEX "ai_analyses_analysisType_idx" ON "ai_analyses"("analysisType");

-- CreateIndex
CREATE INDEX "ai_analyses_promptHash_idx" ON "ai_analyses"("promptHash");

-- CreateIndex
CREATE INDEX "ai_requests_promptHash_idx" ON "ai_requests"("promptHash");

-- CreateIndex
CREATE INDEX "ai_requests_createdAt_idx" ON "ai_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "availability_eventTypeId_dayOfWeek_startTime_key" ON "availability"("eventTypeId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "bookings_attendeeEmail_idx" ON "bookings"("attendeeEmail");

-- CreateIndex
CREATE INDEX "bookings_startTime_idx" ON "bookings"("startTime");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_responses_bookingId_questionId_key" ON "booking_responses"("bookingId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_userId_provider_calendarId_key" ON "calendar_integrations"("userId", "provider", "calendarId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_contacts" ADD CONSTRAINT "message_contacts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_contacts" ADD CONSTRAINT "message_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_aggregates" ADD CONSTRAINT "analytics_aggregates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_questions" ADD CONSTRAINT "booking_questions_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_responses" ADD CONSTRAINT "booking_responses_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_responses" ADD CONSTRAINT "booking_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "booking_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
