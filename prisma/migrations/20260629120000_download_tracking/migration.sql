-- Real download tracking: link each DownloadLog to the exact installer served,
-- and store basic (privacy-preserving) request metadata. Then realign
-- Product.downloadCount with the *real* number of DownloadLog events, dropping
-- any seeded / manual values so every surface reads a single real source.

-- AddColumn (all nullable — existing rows stay valid)
ALTER TABLE "DownloadLog" ADD COLUMN "installerId" TEXT;
ALTER TABLE "DownloadLog" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "DownloadLog" ADD COLUMN "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "DownloadLog_installerId_idx" ON "DownloadLog"("installerId");

-- AddForeignKey (deleting an installer keeps the history, just nulls the link)
ALTER TABLE "DownloadLog"
  ADD CONSTRAINT "DownloadLog_installerId_fkey"
  FOREIGN KEY ("installerId") REFERENCES "Installer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: downloadCount becomes the real count of download events. This
-- removes any previously seeded / manual values (e.g. the demo 1280) so the
-- public site, admin dashboard and rankings all agree on the same real number.
UPDATE "Product" p
SET "downloadCount" = COALESCE(
  (SELECT COUNT(*)::int FROM "DownloadLog" dl WHERE dl."productId" = p."id"),
  0
);
