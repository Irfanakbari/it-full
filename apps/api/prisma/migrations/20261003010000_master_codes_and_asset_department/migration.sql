ALTER TABLE "Category" ADD COLUMN "Code" VARCHAR(2);
ALTER TABLE "Location" ADD COLUMN "Code" VARCHAR(3);
ALTER TABLE "Asset" ADD COLUMN "DepartmentCode" VARCHAR(15);

CREATE UNIQUE INDEX "Category_Code_key" ON "Category"("Code");
CREATE UNIQUE INDEX "Location_Code_key" ON "Location"("Code");
CREATE INDEX "Asset_DepartmentCode_idx" ON "Asset"("DepartmentCode");
