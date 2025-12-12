-- CRM Phase 2 Database Migration
-- Run this in your PostgreSQL admin console
-- This adds support for: Time Tracking, Roles/Permissions, and E-Signatures

-- ============================================
-- 1. TIME TRACKING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "TimeEntry" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraints
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" 
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "TimeEntry_userId_idx" ON "TimeEntry"("userId");
CREATE INDEX IF NOT EXISTS "TimeEntry_clientId_idx" ON "TimeEntry"("clientId");
CREATE INDEX IF NOT EXISTS "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");
CREATE INDEX IF NOT EXISTS "TimeEntry_startTime_idx" ON "TimeEntry"("startTime");
CREATE INDEX IF NOT EXISTS "TimeEntry_billable_idx" ON "TimeEntry"("billable");
CREATE INDEX IF NOT EXISTS "TimeEntry_invoiced_idx" ON "TimeEntry"("invoiced");

-- ============================================
-- 2. ROLE-BASED ACCESS CONTROL
-- ============================================

CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on role name
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

-- ============================================
-- 3. E-SIGNATURE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "Signature" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS "Signature_entityType_entityId_idx" ON "Signature"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "Signature_status_idx" ON "Signature"("status");
CREATE INDEX IF NOT EXISTS "Signature_signerEmail_idx" ON "Signature"("signerEmail");

-- ============================================
-- 4. INSERT DEFAULT ROLES
-- ============================================

-- Admin role with all permissions
INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'ADMIN',
    'Full system access',
    '["all"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" WHERE "name" = 'ADMIN'
);

-- Manager role
INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'MANAGER',
    'Manage clients, invoices, and team',
    '["clients.read", "clients.write", "invoices.read", "invoices.write", "estimates.read", "estimates.write", "reports.read", "users.read"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" WHERE "name" = 'MANAGER'
);

-- Staff role
INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'STAFF',
    'Basic access to clients and tasks',
    '["clients.read", "tasks.read", "tasks.write", "time.read", "time.write"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" WHERE "name" = 'STAFF'
);

-- Accountant role
INSERT INTO "Role" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'ACCOUNTANT',
    'Financial access only',
    '["invoices.read", "invoices.write", "expenses.read", "expenses.write", "reports.read", "payments.read"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" WHERE "name" = 'ACCOUNTANT'
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
SELECT 
    'Phase 2 Migration Complete!' as status,
    (SELECT COUNT(*) FROM "TimeEntry") as time_entries_count,
    (SELECT COUNT(*) FROM "Role") as roles_count,
    (SELECT COUNT(*) FROM "Signature") as signatures_count;

-- Show created roles
SELECT "name", "description" FROM "Role" ORDER BY "name";
