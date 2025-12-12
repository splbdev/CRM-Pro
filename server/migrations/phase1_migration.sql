-- CRM Phase 1 Database Migration
-- Run this in your PostgreSQL admin console (pgAdmin, DBeaver, psql, etc.)
-- This adds support for: File Attachments, Expense Tracking, and Automated Reminders

-- ============================================
-- 1. ATTACHMENT SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT NOT NULL,
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

-- Index for faster lookups by entity
CREATE INDEX IF NOT EXISTS "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- ============================================
-- 2. EXPENSE TRACKING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- Indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date");
CREATE INDEX IF NOT EXISTS "Expense_category_idx" ON "Expense"("category");
CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "Expense"("status");

CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on category name
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- ============================================
-- 3. AUTOMATED REMINDER SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "ReminderConfig" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "daysBefore" INTEGER,
    "daysAfter" INTEGER,
    "templateId" TEXT,
    "channels" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderConfig_pkey" PRIMARY KEY ("id")
);

-- Index for quick lookup by type
CREATE INDEX IF NOT EXISTS "ReminderConfig_type_idx" ON "ReminderConfig"("type");

CREATE TABLE IF NOT EXISTS "ReminderLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- Indexes for filtering logs
CREATE INDEX IF NOT EXISTS "ReminderLog_entityType_entityId_idx" ON "ReminderLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "ReminderLog_sentAt_idx" ON "ReminderLog"("sentAt");

-- ============================================
-- 4. INSERT DEFAULT REMINDER CONFIGURATIONS
-- ============================================

-- Insert default reminder configurations if they don't exist
INSERT INTO "ReminderConfig" ("id", "type", "enabled", "daysBefore", "daysAfter", "templateId", "channels", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'INVOICE_OVERDUE',
    true,
    NULL,
    1,
    NULL,
    '["EMAIL"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ReminderConfig" WHERE "type" = 'INVOICE_OVERDUE'
);

INSERT INTO "ReminderConfig" ("id", "type", "enabled", "daysBefore", "daysAfter", "templateId", "channels", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'INVOICE_DUE_SOON',
    true,
    3,
    NULL,
    NULL,
    '["EMAIL"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ReminderConfig" WHERE "type" = 'INVOICE_DUE_SOON'
);

INSERT INTO "ReminderConfig" ("id", "type", "enabled", "daysBefore", "daysAfter", "templateId", "channels", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'ESTIMATE_FOLLOWUP',
    false,
    NULL,
    7,
    NULL,
    '["EMAIL"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ReminderConfig" WHERE "type" = 'ESTIMATE_FOLLOWUP'
);

-- ============================================
-- 5. INSERT DEFAULT EXPENSE CATEGORIES
-- ============================================

-- Insert some common expense categories
INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'Office Supplies',
    '#3b82f6',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Office Supplies'
);

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'Travel',
    '#10b981',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Travel'
);

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'Marketing',
    '#f59e0b',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Marketing'
);

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'Software & Tools',
    '#8b5cf6',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Software & Tools'
);

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'Utilities',
    '#ec4899',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Utilities'
);

INSERT INTO "ExpenseCategory" ("id", "name", "color", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'Professional Services',
    '#14b8a6',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ExpenseCategory" WHERE "name" = 'Professional Services'
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
SELECT 
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM "Attachment") as attachments_count,
    (SELECT COUNT(*) FROM "Expense") as expenses_count,
    (SELECT COUNT(*) FROM "ExpenseCategory") as categories_count,
    (SELECT COUNT(*) FROM "ReminderConfig") as reminder_configs_count,
    (SELECT COUNT(*) FROM "ReminderLog") as reminder_logs_count;

-- Show created expense categories
SELECT "name", "color" FROM "ExpenseCategory" ORDER BY "name";

-- Show reminder configurations
SELECT "type", "enabled", "daysBefore", "daysAfter", "channels" FROM "ReminderConfig" ORDER BY "type";
