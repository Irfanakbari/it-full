-- AlterTable
ALTER TABLE "AppUser"
ADD COLUMN "DeletedAt" TIMESTAMP(3),
ADD COLUMN "DeletedBy" TEXT;

-- CreateIndex
CREATE INDEX "AppUser_DeletedAt_idx" ON "AppUser"("DeletedAt");
