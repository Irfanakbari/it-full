-- Employee and department masters are owned by ESSA/HRIS.
-- Keep immutable employee number/name snapshots on asset assignment history.
ALTER TABLE "Asset"
ADD COLUMN "CurrentEmployeeNo" VARCHAR(30),
ADD COLUMN "CurrentEmployeeName" VARCHAR(255);

UPDATE "Asset" AS asset
SET
  "CurrentEmployeeNo" = person."Nik",
  "CurrentEmployeeName" = person."FullName"
FROM "Person" AS person
WHERE asset."CurrentPersonId" = person."Id";

ALTER TABLE "AssetUserAssignment"
ADD COLUMN "EmployeeNo" VARCHAR(30),
ADD COLUMN "EmployeeName" VARCHAR(255);

UPDATE "AssetUserAssignment" AS assignment
SET
  "EmployeeNo" = person."Nik",
  "EmployeeName" = person."FullName"
FROM "Person" AS person
WHERE assignment."PersonId" = person."Id";

ALTER TABLE "AssetUserAssignment"
ALTER COLUMN "EmployeeNo" SET NOT NULL,
ALTER COLUMN "EmployeeName" SET NOT NULL;

DROP TABLE "AssetDepartmentAssignment";

ALTER TABLE "AssetUserAssignment" DROP CONSTRAINT "AssetUserAssignment_PersonId_fkey";
DROP INDEX "AssetUserAssignment_PersonId_LastUsed_idx";
ALTER TABLE "AssetUserAssignment" DROP COLUMN "PersonId";

ALTER TABLE "Asset" DROP CONSTRAINT "Asset_CurrentPersonId_fkey";
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_CurrentDepartmentId_fkey";
DROP INDEX "Asset_CurrentPersonId_idx";
DROP INDEX "Asset_CurrentDepartmentId_idx";
ALTER TABLE "Asset" DROP COLUMN "CurrentPersonId";
ALTER TABLE "Asset" DROP COLUMN "CurrentDepartmentId";

DROP TABLE "Person";
DROP TABLE "Department";

CREATE INDEX "Asset_CurrentEmployeeNo_idx" ON "Asset"("CurrentEmployeeNo");
CREATE INDEX "AssetUserAssignment_EmployeeNo_LastUsed_idx" ON "AssetUserAssignment"("EmployeeNo", "LastUsed");
