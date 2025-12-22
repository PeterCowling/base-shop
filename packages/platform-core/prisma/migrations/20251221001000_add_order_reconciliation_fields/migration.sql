-- AlterTable
ALTER TABLE "RentalOrder"
ADD COLUMN "currency" TEXT,
ADD COLUMN "subtotalAmount" INTEGER,
ADD COLUMN "taxAmount" INTEGER,
ADD COLUMN "shippingAmount" INTEGER,
ADD COLUMN "discountAmount" INTEGER,
ADD COLUMN "totalAmount" INTEGER,
ADD COLUMN "cartId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "stripeChargeId" TEXT,
ADD COLUMN "stripeBalanceTransactionId" TEXT,
ADD COLUMN "stripeCustomerId" TEXT;
