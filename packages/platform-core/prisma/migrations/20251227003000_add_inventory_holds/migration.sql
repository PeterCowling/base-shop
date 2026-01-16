-- CreateTable
CREATE TABLE "InventoryHold" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "committedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryHold_shopId_idx" ON "InventoryHold"("shopId");

-- CreateIndex
CREATE INDEX "InventoryHold_shopId_status_idx" ON "InventoryHold"("shopId", "status");

-- CreateIndex
CREATE INDEX "InventoryHold_expiresAt_idx" ON "InventoryHold"("expiresAt");

-- CreateTable
CREATE TABLE "InventoryHoldItem" (
    "id" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "variantAttributes" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryHoldItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryHoldItem_shopId_idx" ON "InventoryHoldItem"("shopId");

-- CreateIndex
CREATE INDEX "InventoryHoldItem_variantKey_idx" ON "InventoryHoldItem"("variantKey");

-- CreateIndex
CREATE INDEX "InventoryHoldItem_holdId_idx" ON "InventoryHoldItem"("holdId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryHoldItem_holdId_variantKey_key" ON "InventoryHoldItem"("holdId", "variantKey");

-- AddForeignKey
ALTER TABLE "InventoryHoldItem" ADD CONSTRAINT "InventoryHoldItem_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "InventoryHold"("id") ON DELETE CASCADE ON UPDATE CASCADE;
