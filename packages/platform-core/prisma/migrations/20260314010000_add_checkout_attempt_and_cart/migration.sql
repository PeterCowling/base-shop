-- Migration: add_checkout_attempt_and_cart
-- Adds Worker-safe Prisma-backed checkout idempotency store and cart store.
-- Replaces fs-based idempotency store and MemoryCartStore for Caryina.
-- Additive-only: no existing tables modified.

-- CreateTable
CREATE TABLE "CheckoutAttempt" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "acceptedLegalTerms" BOOLEAN,
    "acceptedLegalTermsAt" TIMESTAMP(3),
    "provider" TEXT,
    "shopTransactionId" TEXT,
    "holdId" TEXT,
    "cartId" TEXT,
    "lang" TEXT,
    "buyerName" TEXT,
    "buyerEmail" TEXT,
    "paymentAttemptedAt" TIMESTAMP(3),
    "stripeSessionId" TEXT,
    "stripeSessionExpiresAt" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutAttempt_shopId_idempotencyKey_key" ON "CheckoutAttempt"("shopId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "CheckoutAttempt_shopId_idx" ON "CheckoutAttempt"("shopId");

-- CreateIndex
CREATE INDEX "CheckoutAttempt_status_idx" ON "CheckoutAttempt"("status");

-- CreateIndex
CREATE INDEX "CheckoutAttempt_updatedAt_idx" ON "CheckoutAttempt"("updatedAt");

-- CreateIndex
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");
