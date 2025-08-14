ALTER TABLE "RentalOrder"
ADD COLUMN "returnDueDate" TEXT,
ADD COLUMN "returnReceivedAt" TEXT,
ADD COLUMN "lateFeeCharged" INTEGER;

CREATE TABLE "ReverseLogisticsEvent" (
  "id" TEXT PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "at" TEXT NOT NULL
);

CREATE INDEX "ReverseLogisticsEvent_shop_sessionId_idx" ON "ReverseLogisticsEvent"("shop", "sessionId");
