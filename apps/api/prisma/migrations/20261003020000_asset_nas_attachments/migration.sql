CREATE TABLE "AssetAttachment" (
    "Id" SERIAL NOT NULL,
    "AssetId" INTEGER NOT NULL,
    "FileName" VARCHAR(255) NOT NULL,
    "FilePath" VARCHAR(2048) NOT NULL,
    "OriginalFileName" VARCHAR(255) NOT NULL,
    "FileSize" INTEGER NOT NULL,
    "MimeType" VARCHAR(120) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT NOT NULL,
    "DeletedAt" TIMESTAMP(3),
    "DeletedBy" TEXT,

    CONSTRAINT "AssetAttachment_pkey" PRIMARY KEY ("Id")
);

INSERT INTO "AssetAttachment" (
    "AssetId", "FileName", "FilePath", "OriginalFileName", "FileSize", "MimeType", "CreatedAt", "CreatedBy"
)
SELECT
    "Id",
    LEFT("SupportFile", 255),
    "SupportFile",
    LEFT("SupportFile", 255),
    0,
    'application/octet-stream',
    "UpdatedAt",
    "UpdatedBy"
FROM "Asset"
WHERE "SupportFile" IS NOT NULL AND BTRIM("SupportFile") <> '';

CREATE INDEX "AssetAttachment_AssetId_DeletedAt_idx" ON "AssetAttachment"("AssetId", "DeletedAt");
CREATE INDEX "AssetAttachment_DeletedAt_idx" ON "AssetAttachment"("DeletedAt");

ALTER TABLE "AssetAttachment"
ADD CONSTRAINT "AssetAttachment_AssetId_fkey"
FOREIGN KEY ("AssetId") REFERENCES "Asset"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Asset" DROP COLUMN "SupportFile";
