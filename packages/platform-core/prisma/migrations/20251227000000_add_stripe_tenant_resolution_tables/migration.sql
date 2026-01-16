-- CreateTable
CREATE TABLE "StripeObjectShopMap" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "stripeId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StripeObjectShopMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeObjectShopMap_environment_objectType_stripeId_key" ON "StripeObjectShopMap"("environment", "objectType", "stripeId");

-- CreateIndex
CREATE INDEX "StripeObjectShopMap_environment_stripeId_idx" ON "StripeObjectShopMap"("environment", "stripeId");

-- CreateIndex
CREATE INDEX "StripeObjectShopMap_shopId_idx" ON "StripeObjectShopMap"("shopId");

-- CreateTable
CREATE TABLE "StripeWebhookDeadLetter" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "shopId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripeWebhookDeadLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookDeadLetter_environment_eventId_key" ON "StripeWebhookDeadLetter"("environment", "eventId");

-- CreateIndex
CREATE INDEX "StripeWebhookDeadLetter_environment_idx" ON "StripeWebhookDeadLetter"("environment");

-- CreateIndex
CREATE INDEX "StripeWebhookDeadLetter_shopId_idx" ON "StripeWebhookDeadLetter"("shopId");

-- CreateIndex
CREATE INDEX "StripeWebhookDeadLetter_reason_idx" ON "StripeWebhookDeadLetter"("reason");

