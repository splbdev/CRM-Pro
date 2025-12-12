-- ============================================
-- CRM COMPLETE DATABASE INITIALIZATION SCRIPT
-- ============================================
-- This script includes ALL features from Phases 1, 2, and 3
-- Run this in PostgreSQL admin console (pgAdmin, DBeaver, psql, etc.)
--
-- Features Included:
-- - Core CRM (Users, Clients, Invoices, Estimates, Proposals, Templates)
-- - File Attachments
-- - Expense Tracking
-- - Automated Reminders
-- - Time Tracking
-- - Roles & Permissions
-- - E-Signatures
-- - Lead Management
-- - Project Management
-- - API Keys & Webhooks
-- ============================================

-- First, create the database (run this separately if needed):
-- CREATE DATABASE crm;

-- Then connect to the crm database and run the following:

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'USER',
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Clients table
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- Invoices table
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "items" JSONB NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "nextRun" TIMESTAMP(3),
    
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_number_key" ON "Invoice"("number");

-- Estimates table
CREATE TABLE IF NOT EXISTS "Estimate" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "items" JSONB NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Estimate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Estimate_number_key" ON "Estimate"("number");

-- Proposals table
CREATE TABLE IF NOT EXISTS "Proposal" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- Templates table
CREATE TABLE IF NOT EXISTS "Template" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "style" JSONB,
    "category" TEXT NOT NULL DEFAULT 'CUSTOM',
    "logoUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- Provider Configurations table
CREATE TABLE IF NOT EXISTS "ProviderConfig" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "credentials" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("id")
);

-- Messages table
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "provider" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL DEFAULT 'STRIPE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");

-- Audit Logs table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- ============================================
-- PHASE 1: FILE ATTACHMENTS & EXPENSE TRACKING
-- ============================================

-- Attachments table
CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- Expenses table
CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date");
CREATE INDEX IF NOT EXISTS "Expense_category_idx" ON "Expense"("category");
CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "Expense"("status");

-- Expense Categories table
CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- Reminder Configuration table
CREATE TABLE IF NOT EXISTS "ReminderConfig" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "daysBefore" INTEGER,
    "daysAfter" INTEGER,
    "templateId" TEXT,
    "channels" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderConfig_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ReminderConfig_type_idx" ON "ReminderConfig"("type");

-- Reminder Logs table
CREATE TABLE IF NOT EXISTS "ReminderLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ReminderLog_entityType_entityId_idx" ON "ReminderLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "ReminderLog_sentAt_idx" ON "ReminderLog"("sentAt");

-- ============================================
-- PHASE 2: TIME TRACKING & ROLES
-- ============================================

-- Time Entries table
CREATE TABLE IF NOT EXISTS "TimeEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "taskId" TEXT,
    "description" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "hourlyRate" DOUBLE PRECISION,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "invoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TimeEntry_userId_idx" ON "TimeEntry"("userId");
CREATE INDEX IF NOT EXISTS "TimeEntry_clientId_idx" ON "TimeEntry"("clientId");
CREATE INDEX IF NOT EXISTS "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");
CREATE INDEX IF NOT EXISTS "TimeEntry_startTime_idx" ON "TimeEntry"("startTime");
CREATE INDEX IF NOT EXISTS "TimeEntry_billable_idx" ON "TimeEntry"("billable");
CREATE INDEX IF NOT EXISTS "TimeEntry_invoiced_idx" ON "TimeEntry"("invoiced");

-- Roles table
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

-- Signatures table
CREATE TABLE IF NOT EXISTS "Signature" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Signature_entityType_entityId_idx" ON "Signature"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "Signature_status_idx" ON "Signature"("status");
CREATE INDEX IF NOT EXISTS "Signature_signerEmail_idx" ON "Signature"("signerEmail");

-- ============================================
-- PHASE 3: LEADS, PROJECTS & API
-- ============================================

-- Leads table
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lead_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");
CREATE INDEX IF NOT EXISTS "Lead_assignedTo_idx" ON "Lead"("assignedTo");
CREATE INDEX IF NOT EXISTS "Lead_score_idx" ON "Lead"("score");

-- Projects table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");

-- Milestones table
CREATE TABLE IF NOT EXISTS "Milestone" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Milestone_projectId_idx" ON "Milestone"("projectId");
CREATE INDEX IF NOT EXISTS "Milestone_completed_idx" ON "Milestone"("completed");

-- API Keys table
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_key_key" ON "ApiKey"("key");
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- Webhooks table
CREATE TABLE IF NOT EXISTS "Webhook" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "url" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Webhook_isActive_idx" ON "Webhook"("isActive");

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default expense categories
INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT gen_random_uuid()::text, 'Office Supplies', '#3b82f6', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Office Supplies');

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT gen_random_uuid()::text, 'Travel', '#10b981', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Travel');

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT gen_random_uuid()::text, 'Marketing', '#f59e0b', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Marketing');

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT gen_random_uuid()::text, 'Software & Tools', '#8b5cf6', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Software & Tools');

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT gen_random_uuid()::text, 'Utilities', '#ec4899', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Utilities');

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT gen_random_uuid()::text, 'Professional Services', '#14b8a6', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Professional Services');

-- Insert default reminder configurations
INSERT INTO "ReminderConfig" ("id", "type", "enabled", "daysBefore", "daysAfter", "templateId", "channels", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'INVOICE_OVERDUE', true, NULL, 1, NULL, '["EMAIL"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ReminderConfig" WHERE "type" = 'INVOICE_OVERDUE');

INSERT INTO "ReminderConfig" ("id", "type", "enabled", "daysBefore", "daysAfter", "templateId", "channels", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'INVOICE_DUE_SOON', true, 3, NULL, NULL, '["EMAIL"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ReminderConfig" WHERE "type" = 'INVOICE_DUE_SOON');

INSERT INTO "ReminderConfig" ("id", "type", "enabled", "daysBefore", "daysAfter", "templateId", "channels", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'ESTIMATE_FOLLOWUP', false, NULL, 7, NULL, '["EMAIL"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ReminderConfig" WHERE "type" = 'ESTIMATE_FOLLOWUP');

-- Insert default roles
INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'ADMIN', 'Full system access', '["all"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Role" WHERE "name" = 'ADMIN');

INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'MANAGER', 'Manage clients, invoices, and team', '["clients.read", "clients.write", "invoices.read", "invoices.write", "estimates.read", "estimates.write", "reports.read", "users.read"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Role" WHERE "name" = 'MANAGER');

INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'STAFF', 'Basic access to clients and tasks', '["clients.read", "tasks.read", "tasks.write", "time.read", "time.write"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Role" WHERE "name" = 'STAFF');

INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'ACCOUNTANT', 'Financial access only', '["invoices.read", "invoices.write", "expenses.read", "expenses.write", "reports.read", "payments.read"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Role" WHERE "name" = 'ACCOUNTANT');

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    'Database Initialization Complete!' as status,
    (SELECT COUNT(*) FROM "User") as users_count,
    (SELECT COUNT(*) FROM "Client") as clients_count,
    (SELECT COUNT(*) FROM "Invoice") as invoices_count,
    (SELECT COUNT(*) FROM "ExpenseCategory") as expense_categories_count,
    (SELECT COUNT(*) FROM "ReminderConfig") as reminder_configs_count,
    (SELECT COUNT(*) FROM "Role") as roles_count;
