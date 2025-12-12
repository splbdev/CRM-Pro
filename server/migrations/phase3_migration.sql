-- CRM Phase 3 Database Migration
-- Run this in your PostgreSQL admin console
-- This adds support for: Lead Management, Project Management, and API/Integrations

-- ============================================
-- 1. LEAD MANAGEMENT SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assignedTo" TEXT,
    "convertedToClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Foreign key for assigned user
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedTo_fkey" 
    FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");
CREATE INDEX IF NOT EXISTS "Lead_assignedTo_idx" ON "Lead"("assignedTo");
CREATE INDEX IF NOT EXISTS "Lead_score_idx" ON "Lead"("score");

-- ============================================
-- 2. PROJECT MANAGEMENT SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Foreign key for client
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");

CREATE TABLE IF NOT EXISTS "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- Foreign key for project
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "Milestone_projectId_idx" ON "Milestone"("projectId");
CREATE INDEX IF NOT EXISTS "Milestone_completed_idx" ON "Milestone"("completed");

-- ============================================
-- 3. API & INTEGRATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on key
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_key_key" ON "ApiKey"("key");

-- Indexes
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_isActive_idx" ON "ApiKey"("isActive");

CREATE TABLE IF NOT EXISTS "Webhook" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Webhook_isActive_idx" ON "Webhook"("isActive");

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
SELECT 
    'Phase 3 Migration Complete!' as status,
    (SELECT COUNT(*) FROM "Lead") as leads_count,
    (SELECT COUNT(*) FROM "Project") as projects_count,
    (SELECT COUNT(*) FROM "Milestone") as milestones_count,
    (SELECT COUNT(*) FROM "ApiKey") as api_keys_count,
    (SELECT COUNT(*) FROM "Webhook") as webhooks_count;
