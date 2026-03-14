-- Add optional reason column to Refund table for operator notes and caller context
ALTER TABLE "Refund" ADD COLUMN "reason" TEXT;
