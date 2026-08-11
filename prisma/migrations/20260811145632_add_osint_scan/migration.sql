-- CreateTable
CREATE TABLE "OsintScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultJson" TEXT NOT NULL,
    "manualNotes" TEXT,
    CONSTRAINT "OsintScan_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OsintScan_vendorId_idx" ON "OsintScan"("vendorId");
