-- AlterTable
ALTER TABLE "RentalOrder"
ADD COLUMN "riskLevel" TEXT,
ADD COLUMN "riskScore" INTEGER,
ADD COLUMN "flaggedForReview" BOOLEAN DEFAULT false;
