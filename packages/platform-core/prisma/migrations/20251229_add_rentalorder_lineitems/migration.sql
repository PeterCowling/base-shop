-- Add lineItems JSON column to RentalOrder for variant allocations
ALTER TABLE "RentalOrder"
ADD COLUMN IF NOT EXISTS "lineItems" JSONB;
