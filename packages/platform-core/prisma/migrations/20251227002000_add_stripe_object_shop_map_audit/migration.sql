-- CreateTable
CREATE TABLE "StripeObjectShopMapAudit" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "stripeId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeObjectShopMapAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StripeObjectShopMapAudit_environment_idx" ON "StripeObjectShopMapAudit"("environment");

-- CreateIndex
CREATE INDEX "StripeObjectShopMapAudit_stripeId_idx" ON "StripeObjectShopMapAudit"("stripeId");

-- CreateIndex
CREATE INDEX "StripeObjectShopMapAudit_shopId_idx" ON "StripeObjectShopMapAudit"("shopId");

-- CreateIndex
CREATE INDEX "StripeObjectShopMapAudit_createdAt_idx" ON "StripeObjectShopMapAudit"("createdAt");

