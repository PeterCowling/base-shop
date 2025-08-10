-- CreateTable
CREATE TABLE "RentalOrder" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "deposit" INTEGER NOT NULL,
    "expectedReturnDate" TEXT,
    "startedAt" TEXT NOT NULL,
    "returnedAt" TEXT,
    "refundedAt" TEXT,
    "damageFee" INTEGER,
    "customerId" TEXT,
    CONSTRAINT "RentalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentalOrder_shop_sessionId_key" ON "RentalOrder"("shop", "sessionId");

-- CreateIndex
CREATE INDEX "RentalOrder_customerId_idx" ON "RentalOrder"("customerId");
