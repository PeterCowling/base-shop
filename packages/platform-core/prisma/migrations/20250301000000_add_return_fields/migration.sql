ALTER TABLE "RentalOrder"
  ADD COLUMN "returnDueDate" TEXT,
  ADD COLUMN "returnReceivedAt" TEXT,
  ADD COLUMN "lateFeeCharged" INTEGER;
