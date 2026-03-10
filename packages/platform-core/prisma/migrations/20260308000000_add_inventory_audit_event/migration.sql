-- CreateTable
CREATE TABLE "InventoryAuditEvent" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "note" TEXT,
    "referenceId" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryAuditEvent_shopId_idx" ON "InventoryAuditEvent"("shopId");

-- CreateIndex
CREATE INDEX "InventoryAuditEvent_shopId_sku_idx" ON "InventoryAuditEvent"("shopId", "sku");

-- CreateIndex
CREATE INDEX "InventoryAuditEvent_shopId_type_idx" ON "InventoryAuditEvent"("shopId", "type");

-- CreateIndex
CREATE INDEX "InventoryAuditEvent_referenceId_idx" ON "InventoryAuditEvent"("referenceId");
