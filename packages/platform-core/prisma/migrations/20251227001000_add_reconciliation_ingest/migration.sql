-- CreateTable
CREATE TABLE "ReconciliationIngest" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "requestId" TEXT,
    "currency" TEXT NOT NULL,
    "amountTotalMinor" INTEGER NOT NULL,
    "normalizationApplied" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationIngest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReconciliationIngest_shop_idx" ON "ReconciliationIngest"("shop");

-- CreateIndex
CREATE INDEX "ReconciliationIngest_sessionId_idx" ON "ReconciliationIngest"("sessionId");

-- CreateIndex
CREATE INDEX "ReconciliationIngest_createdAt_idx" ON "ReconciliationIngest"("createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationIngest_normalizationApplied_idx" ON "ReconciliationIngest"("normalizationApplied");

