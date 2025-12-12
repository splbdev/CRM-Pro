-- ROLLBACK SCRIPT for Phase 1 Migration
-- Run this if you need to undo the Phase 1 changes
-- WARNING: This will delete all data in these tables!

-- Drop tables in reverse order (to handle any future foreign keys)
DROP TABLE IF EXISTS "ReminderLog" CASCADE;
DROP TABLE IF EXISTS "ReminderConfig" CASCADE;
DROP TABLE IF EXISTS "ExpenseCategory" CASCADE;
DROP TABLE IF EXISTS "Expense" CASCADE;
DROP TABLE IF EXISTS "Attachment" CASCADE;

-- Verify rollback
SELECT 'Rollback Complete!' as status;
