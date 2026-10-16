-- Remove soft delete columns from AppUser and drop the index
DROP INDEX IF EXISTS "AppUser_DeletedAt_idx";

ALTER TABLE "AppUser"
DROP COLUMN IF EXISTS "DeletedAt",
DROP COLUMN IF EXISTS "DeletedBy";
