-- CreateTable
CREATE TABLE "StripeObjectShopMap" (
    "id" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL,
    "objectType" TEXT NOT NULL,
    "stripeId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeObjectShopMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookDeadLetter" (
    "id" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "shopId" TEXT,
    "reason" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeWebhookDeadLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeObjectShopMap_livemode_objectType_stripeId_key" ON "StripeObjectShopMap"("livemode", "objectType", "stripeId");

-- CreateIndex
CREATE INDEX "StripeObjectShopMap_shopId_idx" ON "StripeObjectShopMap"("shopId");

-- CreateIndex
CREATE INDEX "StripeObjectShopMap_stripeId_idx" ON "StripeObjectShopMap"("stripeId");

-- CreateIndex
CREATE INDEX "StripeObjectShopMap_updatedAt_idx" ON "StripeObjectShopMap"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookDeadLetter_livemode_stripeEventId_key" ON "StripeWebhookDeadLetter"("livemode", "stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookDeadLetter_shopId_idx" ON "StripeWebhookDeadLetter"("shopId");

-- CreateIndex
CREATE INDEX "StripeWebhookDeadLetter_reason_idx" ON "StripeWebhookDeadLetter"("reason");

-- CreateIndex
CREATE INDEX "StripeWebhookDeadLetter_createdAt_idx" ON "StripeWebhookDeadLetter"("createdAt");