CREATE TABLE "AssetDepartmentAssignment" (
    "Id" SERIAL NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "DepartmentCode" VARCHAR(15) NOT NULL,
    "DepartmentName" VARCHAR(255),
    "StartUsed" TIMESTAMP(3) NOT NULL,
    "Notes" VARCHAR(500),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,

    CONSTRAINT "AssetDepartmentAssignment_pkey" PRIMARY KEY ("Id")
);

CREATE INDEX "AssetDepartmentAssignment_AssetId_StartUsed_idx"
ON "AssetDepartmentAssignment"("AssetId", "StartUsed");

CREATE INDEX "AssetDepartmentAssignment_DepartmentCode_StartUsed_idx"
ON "AssetDepartmentAssignment"("DepartmentCode", "StartUsed");

ALTER TABLE "AssetDepartmentAssignment"
ADD CONSTRAINT "AssetDepartmentAssignment_AssetId_fkey"
FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "AssetDepartmentAssignment"
    ("AssetId", "DepartmentCode", "DepartmentName", "StartUsed", "Notes", "CreatedAt", "CreatedBy")
SELECT
    "Id", "DepartmentCode", NULL, "CreatedAt", 'Baseline imported from current asset department', "CreatedAt", 'System Migration'
FROM "Asset"
WHERE "DepartmentCode" IS NOT NULL;
