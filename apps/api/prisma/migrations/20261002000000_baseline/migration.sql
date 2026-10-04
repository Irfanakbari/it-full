-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SortOrder" AS ENUM ('ASC', 'DESC');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('GOOD', 'DAMAGED', 'LOST');

-- CreateEnum
CREATE TYPE "StockOpnameStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'VERIFIED', 'APPROVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuthAction" AS ENUM ('LOGIN', 'LOGOUT', 'SSO_CALLBACK', 'BACKCHANNEL_LOGOUT');

-- CreateEnum
CREATE TYPE "AuthStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Role" (
    "Id" SERIAL NOT NULL,
    "RoleName" VARCHAR(80) NOT NULL,
    "Description" VARCHAR(255),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "Id" SERIAL NOT NULL,
    "Action" VARCHAR(120) NOT NULL,
    "Description" VARCHAR(255),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "Id" TEXT NOT NULL,
    "SsoObjectId" TEXT NOT NULL,
    "UserName" VARCHAR(120) NOT NULL,
    "Name" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(255),
    "PhoneNumber" VARCHAR(32),
    "RoleId" INTEGER,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "LastLogin" TIMESTAMP(3),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Department" (
    "Id" SERIAL NOT NULL,
    "Code" VARCHAR(30) NOT NULL,
    "Name" VARCHAR(150) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Category" (
    "Id" SERIAL NOT NULL,
    "Name" VARCHAR(120) NOT NULL,
    "Description" VARCHAR(255),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Location" (
    "Id" SERIAL NOT NULL,
    "Name" VARCHAR(120) NOT NULL,
    "Address" VARCHAR(255),
    "Floor" VARCHAR(50),
    "Room" VARCHAR(80),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Person" (
    "Id" TEXT NOT NULL,
    "Nik" VARCHAR(30) NOT NULL,
    "FullName" VARCHAR(255) NOT NULL,
    "DepartmentId" INTEGER,
    "Email" VARCHAR(255),
    "Phone" VARCHAR(32),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "Person_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "Id" SERIAL NOT NULL,
    "Key" VARCHAR(120) NOT NULL,
    "Description" VARCHAR(255),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "Id" SERIAL NOT NULL,
    "AssetTag" VARCHAR(80) NOT NULL,
    "HostName" VARCHAR(120),
    "Name" VARCHAR(255) NOT NULL,
    "Brand" VARCHAR(120),
    "Model" VARCHAR(120),
    "SerialNumber" VARCHAR(160),
    "Notes" TEXT,
    "SupportFile" VARCHAR(2048),
    "CategoryId" INTEGER,
    "LocationId" INTEGER,
    "CurrentPersonId" TEXT,
    "CurrentDepartmentId" INTEGER,
    "WarrantyStart" TIMESTAMP(3),
    "WarrantyEnd" TIMESTAMP(3),
    "PurchaseDate" TIMESTAMP(3),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "IsDisposed" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AssetAttribute" (
    "Id" SERIAL NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "AttributeDefinitionId" INTEGER NOT NULL,
    "Value" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,

    CONSTRAINT "AssetAttribute_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AssetUserAssignment" (
    "Id" TEXT NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "PersonId" TEXT NOT NULL,
    "StartUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastUsed" TIMESTAMP(3),
    "Notes" VARCHAR(500),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,

    CONSTRAINT "AssetUserAssignment_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AssetDepartmentAssignment" (
    "Id" TEXT NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "DepartmentId" INTEGER NOT NULL,
    "StartUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastUsed" TIMESTAMP(3),
    "Notes" VARCHAR(500),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,

    CONSTRAINT "AssetDepartmentAssignment_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "Id" TEXT NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "MaintenanceDate" TIMESTAMP(3) NOT NULL,
    "MaintenanceEnd" TIMESTAMP(3),
    "MaintenanceType" VARCHAR(100) NOT NULL,
    "IsClosed" BOOLEAN NOT NULL DEFAULT false,
    "SupportFile" VARCHAR(2048),
    "Problem" TEXT,
    "Description" TEXT,
    "Cost" DECIMAL(15,2),
    "Vendor" VARCHAR(255),
    "IsInternal" BOOLEAN NOT NULL DEFAULT false,
    "PerformedBy" VARCHAR(255),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "License" (
    "Id" SERIAL NOT NULL,
    "AssetId" INTEGER,
    "LicenseName" VARCHAR(255) NOT NULL,
    "LicenseKeyCiphertext" TEXT,
    "LicenseType" VARCHAR(100) NOT NULL,
    "LicenseRemark" TEXT,
    "SupportFile" VARCHAR(2048),
    "StartDate" TIMESTAMP(3),
    "EndDate" TIMESTAMP(3),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "License_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Disposal" (
    "Id" TEXT NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "DisposalDate" TIMESTAMP(3) NOT NULL,
    "Reason" TEXT NOT NULL,
    "SupportFile" VARCHAR(2048),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,

    CONSTRAINT "Disposal_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "StockOpname" (
    "Id" SERIAL NOT NULL,
    "DocNumber" VARCHAR(80) NOT NULL,
    "OpnameDate" TIMESTAMP(3) NOT NULL,
    "Period" VARCHAR(80),
    "Status" "StockOpnameStatus" NOT NULL DEFAULT 'OPEN',
    "Remark" TEXT,
    "VerifiedBy" TEXT,
    "VerifiedAt" TIMESTAMP(3),
    "ApprovedBy" TEXT,
    "ApprovedAt" TIMESTAMP(3),
    "ClosedBy" TEXT,
    "ClosedAt" TIMESTAMP(3),
    "CancelledBy" TEXT,
    "CancelledAt" TIMESTAMP(3),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" TEXT NOT NULL,

    CONSTRAINT "StockOpname_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "StockOpnameDetail" (
    "Id" SERIAL NOT NULL,
    "StockOpnameId" INTEGER NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "IsPresent" BOOLEAN,
    "Condition" "AssetCondition",
    "Notes" TEXT,
    "PictureUrl" VARCHAR(2048),
    "ScannedAt" TIMESTAMP(3),
    "ScannedBy" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOpnameDetail_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "LogProcess" (
    "ProcessId" VARCHAR(80) NOT NULL,
    "FunctionId" VARCHAR(120) NOT NULL,
    "FunctionName" VARCHAR(255) NOT NULL,
    "RequestId" VARCHAR(128),
    "ProcessStatus" VARCHAR(20) NOT NULL,
    "ProcessStart" TIMESTAMP(3) NOT NULL,
    "ProcessEnd" TIMESTAMP(3),
    "ProcessDate" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT,

    CONSTRAINT "LogProcess_pkey" PRIMARY KEY ("ProcessId")
);

-- CreateTable
CREATE TABLE "LogProcessDetail" (
    "ProcessDetailId" BIGSERIAL NOT NULL,
    "ProcessId" VARCHAR(80) NOT NULL,
    "MessageId" VARCHAR(80) NOT NULL,
    "Message" TEXT NOT NULL,
    "Type" VARCHAR(20) NOT NULL,
    "Location" VARCHAR(255) NOT NULL,
    "ProcessDate" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogProcessDetail_pkey" PRIMARY KEY ("ProcessDetailId")
);

-- CreateTable
CREATE TABLE "ActionAuditEvent" (
    "Id" TEXT NOT NULL,
    "SourceType" VARCHAR(120) NOT NULL,
    "SourceId" VARCHAR(120) NOT NULL,
    "Action" VARCHAR(80) NOT NULL,
    "Actor" TEXT,
    "ActorSource" VARCHAR(40) NOT NULL,
    "RequestId" VARCHAR(128),
    "ProcessId" TEXT,
    "Before" JSONB,
    "After" JSONB,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionAuditEvent_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AuthLog" (
    "Id" TEXT NOT NULL,
    "AppUserId" TEXT,
    "Action" "AuthAction" NOT NULL,
    "Status" "AuthStatus" NOT NULL,
    "FailureReason" VARCHAR(255),
    "RequestId" VARCHAR(128),
    "IpAddress" VARCHAR(45),
    "UserAgent" VARCHAR(500),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLog_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_RoleName_key" ON "Role"("RoleName");

-- CreateIndex
CREATE INDEX "Role_IsActive_idx" ON "Role"("IsActive");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_Action_key" ON "Permission"("Action");

-- CreateIndex
CREATE INDEX "Permission_Action_idx" ON "Permission"("Action");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_SsoObjectId_key" ON "AppUser"("SsoObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_Email_key" ON "AppUser"("Email");

-- CreateIndex
CREATE INDEX "AppUser_RoleId_idx" ON "AppUser"("RoleId");

-- CreateIndex
CREATE INDEX "AppUser_IsActive_idx" ON "AppUser"("IsActive");

-- CreateIndex
CREATE UNIQUE INDEX "Department_Code_key" ON "Department"("Code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_Name_key" ON "Department"("Name");

-- CreateIndex
CREATE INDEX "Department_Name_idx" ON "Department"("Name");

-- CreateIndex
CREATE INDEX "Department_DeletedAt_idx" ON "Department"("DeletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_Name_key" ON "Category"("Name");

-- CreateIndex
CREATE INDEX "Category_DeletedAt_idx" ON "Category"("DeletedAt");

-- CreateIndex
CREATE INDEX "Location_DeletedAt_idx" ON "Location"("DeletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Location_Name_Floor_Room_key" ON "Location"("Name", "Floor", "Room");

-- CreateIndex
CREATE UNIQUE INDEX "Person_Nik_key" ON "Person"("Nik");

-- CreateIndex
CREATE UNIQUE INDEX "Person_Email_key" ON "Person"("Email");

-- CreateIndex
CREATE INDEX "Person_FullName_idx" ON "Person"("FullName");

-- CreateIndex
CREATE INDEX "Person_DepartmentId_idx" ON "Person"("DepartmentId");

-- CreateIndex
CREATE INDEX "Person_DeletedAt_idx" ON "Person"("DeletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_Key_key" ON "AttributeDefinition"("Key");

-- CreateIndex
CREATE INDEX "AttributeDefinition_DeletedAt_idx" ON "AttributeDefinition"("DeletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_AssetTag_key" ON "Asset"("AssetTag");

-- CreateIndex
CREATE INDEX "Asset_Name_idx" ON "Asset"("Name");

-- CreateIndex
CREATE INDEX "Asset_SerialNumber_idx" ON "Asset"("SerialNumber");

-- CreateIndex
CREATE INDEX "Asset_CategoryId_idx" ON "Asset"("CategoryId");

-- CreateIndex
CREATE INDEX "Asset_LocationId_idx" ON "Asset"("LocationId");

-- CreateIndex
CREATE INDEX "Asset_CurrentPersonId_idx" ON "Asset"("CurrentPersonId");

-- CreateIndex
CREATE INDEX "Asset_CurrentDepartmentId_idx" ON "Asset"("CurrentDepartmentId");

-- CreateIndex
CREATE INDEX "Asset_IsActive_IsDisposed_idx" ON "Asset"("IsActive", "IsDisposed");

-- CreateIndex
CREATE INDEX "Asset_DeletedAt_idx" ON "Asset"("DeletedAt");

-- CreateIndex
CREATE INDEX "AssetAttribute_AttributeDefinitionId_idx" ON "AssetAttribute"("AttributeDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetAttribute_AssetId_AttributeDefinitionId_key" ON "AssetAttribute"("AssetId", "AttributeDefinitionId");

-- CreateIndex
CREATE INDEX "AssetUserAssignment_AssetId_LastUsed_idx" ON "AssetUserAssignment"("AssetId", "LastUsed");

-- CreateIndex
CREATE INDEX "AssetUserAssignment_PersonId_LastUsed_idx" ON "AssetUserAssignment"("PersonId", "LastUsed");

-- CreateIndex
CREATE INDEX "AssetDepartmentAssignment_AssetId_LastUsed_idx" ON "AssetDepartmentAssignment"("AssetId", "LastUsed");

-- CreateIndex
CREATE INDEX "AssetDepartmentAssignment_DepartmentId_LastUsed_idx" ON "AssetDepartmentAssignment"("DepartmentId", "LastUsed");

-- CreateIndex
CREATE INDEX "Maintenance_AssetId_IsClosed_idx" ON "Maintenance"("AssetId", "IsClosed");

-- CreateIndex
CREATE INDEX "Maintenance_MaintenanceDate_idx" ON "Maintenance"("MaintenanceDate");

-- CreateIndex
CREATE INDEX "Maintenance_DeletedAt_idx" ON "Maintenance"("DeletedAt");

-- CreateIndex
CREATE INDEX "License_AssetId_idx" ON "License"("AssetId");

-- CreateIndex
CREATE INDEX "License_EndDate_idx" ON "License"("EndDate");

-- CreateIndex
CREATE INDEX "License_DeletedAt_idx" ON "License"("DeletedAt");

-- CreateIndex
CREATE INDEX "Disposal_AssetId_idx" ON "Disposal"("AssetId");

-- CreateIndex
CREATE INDEX "Disposal_DisposalDate_idx" ON "Disposal"("DisposalDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockOpname_DocNumber_key" ON "StockOpname"("DocNumber");

-- CreateIndex
CREATE INDEX "StockOpname_Status_idx" ON "StockOpname"("Status");

-- CreateIndex
CREATE INDEX "StockOpname_OpnameDate_idx" ON "StockOpname"("OpnameDate");

-- CreateIndex
CREATE INDEX "StockOpnameDetail_AssetId_idx" ON "StockOpnameDetail"("AssetId");

-- CreateIndex
CREATE INDEX "StockOpnameDetail_ScannedAt_idx" ON "StockOpnameDetail"("ScannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockOpnameDetail_StockOpnameId_AssetId_key" ON "StockOpnameDetail"("StockOpnameId", "AssetId");

-- CreateIndex
CREATE INDEX "LogProcess_FunctionId_idx" ON "LogProcess"("FunctionId");

-- CreateIndex
CREATE INDEX "LogProcess_RequestId_idx" ON "LogProcess"("RequestId");

-- CreateIndex
CREATE INDEX "LogProcess_ProcessDate_idx" ON "LogProcess"("ProcessDate");

-- CreateIndex
CREATE INDEX "LogProcess_ProcessStatus_idx" ON "LogProcess"("ProcessStatus");

-- CreateIndex
CREATE INDEX "LogProcessDetail_ProcessId_idx" ON "LogProcessDetail"("ProcessId");

-- CreateIndex
CREATE INDEX "LogProcessDetail_ProcessDate_idx" ON "LogProcessDetail"("ProcessDate");

-- CreateIndex
CREATE INDEX "LogProcessDetail_Type_idx" ON "LogProcessDetail"("Type");

-- CreateIndex
CREATE INDEX "ActionAuditEvent_SourceType_SourceId_CreatedAt_idx" ON "ActionAuditEvent"("SourceType", "SourceId", "CreatedAt");

-- CreateIndex
CREATE INDEX "ActionAuditEvent_RequestId_idx" ON "ActionAuditEvent"("RequestId");

-- CreateIndex
CREATE INDEX "ActionAuditEvent_ProcessId_idx" ON "ActionAuditEvent"("ProcessId");

-- CreateIndex
CREATE INDEX "AuthLog_AppUserId_idx" ON "AuthLog"("AppUserId");

-- CreateIndex
CREATE INDEX "AuthLog_CreatedAt_idx" ON "AuthLog"("CreatedAt");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "AppUser" ADD CONSTRAINT "AppUser_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES "Role"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_DepartmentId_fkey" FOREIGN KEY ("DepartmentId") REFERENCES "Department"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_CategoryId_fkey" FOREIGN KEY ("CategoryId") REFERENCES "Category"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_LocationId_fkey" FOREIGN KEY ("LocationId") REFERENCES "Location"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_CurrentPersonId_fkey" FOREIGN KEY ("CurrentPersonId") REFERENCES "Person"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_CurrentDepartmentId_fkey" FOREIGN KEY ("CurrentDepartmentId") REFERENCES "Department"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAttribute" ADD CONSTRAINT "AssetAttribute_AssetId_fkey" FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAttribute" ADD CONSTRAINT "AssetAttribute_AttributeDefinitionId_fkey" FOREIGN KEY ("AttributeDefinitionId") REFERENCES "AttributeDefinition"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetUserAssignment" ADD CONSTRAINT "AssetUserAssignment_AssetId_fkey" FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetUserAssignment" ADD CONSTRAINT "AssetUserAssignment_PersonId_fkey" FOREIGN KEY ("PersonId") REFERENCES "Person"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepartmentAssignment" ADD CONSTRAINT "AssetDepartmentAssignment_AssetId_fkey" FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepartmentAssignment" ADD CONSTRAINT "AssetDepartmentAssignment_DepartmentId_fkey" FOREIGN KEY ("DepartmentId") REFERENCES "Department"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_AssetId_fkey" FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_AssetId_fkey" FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposal" ADD CONSTRAINT "Disposal_AssetId_fkey" FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpnameDetail" ADD CONSTRAINT "StockOpnameDetail_StockOpnameId_fkey" FOREIGN KEY ("StockOpnameId") REFERENCES "StockOpname"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpnameDetail" ADD CONSTRAINT "StockOpnameDetail_AssetId_fkey" FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogProcessDetail" ADD CONSTRAINT "LogProcessDetail_ProcessId_fkey" FOREIGN KEY ("ProcessId") REFERENCES "LogProcess"("ProcessId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionAuditEvent" ADD CONSTRAINT "ActionAuditEvent_ProcessId_fkey" FOREIGN KEY ("ProcessId") REFERENCES "LogProcess"("ProcessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthLog" ADD CONSTRAINT "AuthLog_AppUserId_fkey" FOREIGN KEY ("AppUserId") REFERENCES "AppUser"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain invariants that Prisma cannot express as partial unique constraints.
CREATE UNIQUE INDEX "AssetUserAssignment_one_active_per_asset"
ON "AssetUserAssignment" ("AssetId")
WHERE "LastUsed" IS NULL;

CREATE UNIQUE INDEX "AssetDepartmentAssignment_one_active_per_asset"
ON "AssetDepartmentAssignment" ("AssetId")
WHERE "LastUsed" IS NULL;

CREATE UNIQUE INDEX "Maintenance_one_open_per_asset"
ON "Maintenance" ("AssetId")
WHERE "IsClosed" = false AND "DeletedAt" IS NULL;

CREATE UNIQUE INDEX "StockOpname_one_active"
ON "StockOpname" ((1))
WHERE "Status" IN ('OPEN', 'IN_PROGRESS', 'VERIFIED', 'APPROVED');
