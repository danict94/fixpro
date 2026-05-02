-- Remove legacy isAdmin column — replaced by adminRole enum as single source of truth
ALTER TABLE "users" DROP COLUMN IF EXISTS "isAdmin";
