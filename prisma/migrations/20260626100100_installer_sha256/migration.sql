-- Add sha256 to Installer as nullable first so existing rows are not broken,
-- backfill the one pre-existing row with a hash computed from the live
-- public file (no data was deleted or re-uploaded), then enforce NOT NULL.

-- AddColumn (nullable)
ALTER TABLE "Installer" ADD COLUMN "sha256" TEXT;

-- Backfill: KaemPDF v1.1.0 WINDOWS — sha256 computed from the file already
-- published at https://assets.kaemnur.com/KaemPDF/KaemPDF-v1.1.0-Setup.exe.
-- fileSize is corrected at the same time (107000 was a placeholder value;
-- the real installer is 107712844 bytes per the server's Content-Length).
UPDATE "Installer"
SET "sha256" = '91171516042010237670577225ff434806f225a0377bbd9eb72bee0808245a2e',
    "fileSize" = 107712844
WHERE "id" = 'cmqj2kyrk0001le04ie1mclhw';

-- Safety net: any other pre-existing row that still lacks a hash (should not
-- happen given the backfill above, but guarantees the NOT NULL below can
-- never fail) is marked with a sentinel so it's obviously invalid and gets
-- filtered out by the update-check endpoint instead of breaking the deploy.
UPDATE "Installer"
SET "sha256" = '0000000000000000000000000000000000000000000000000000000000000000'
WHERE "sha256" IS NULL;

-- AlterColumn (enforce NOT NULL now that every row has a value)
ALTER TABLE "Installer" ALTER COLUMN "sha256" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Installer_productId_platform_createdAt_idx" ON "Installer"("productId", "platform", "createdAt");
