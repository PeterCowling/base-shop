-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "media" JSONB NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "forSale" BOOLEAN NOT NULL DEFAULT true,
    "forRental" BOOLEAN NOT NULL DEFAULT false,
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "rentalTerms" TEXT,
    "dailyRate" INTEGER,
    "weeklyRate" INTEGER,
    "monthlyRate" INTEGER,
    "wearAndTearLimit" INTEGER,
    "maintenanceCycle" INTEGER,
    "availability" JSONB,
    "materials" JSONB,
    "dimensions" JSONB,
    "weight" JSONB,
    "publishShops" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_sku_key" ON "Product"("shopId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_id_key" ON "Product"("shopId", "id");

-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId");
