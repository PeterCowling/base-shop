-- CreateTable
CREATE TABLE "InventoryHold" (
    "shopId" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "items" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "committedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "releaseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryHold_pkey" PRIMARY KEY ("shopId","holdId")
);

-- CreateIndex
CREATE INDEX "InventoryHold_shopId_idx" ON "InventoryHold"("shopId");

-- CreateIndex
CREATE INDEX "InventoryHold_status_idx" ON "InventoryHold"("status");

-- CreateIndex
CREATE INDEX "InventoryHold_expiresAt_idx" ON "InventoryHold"("expiresAt");
