-- CreateTable
CREATE TABLE "Setting" (
    "shop" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("shop")
);

-- CreateTable
CREATE TABLE "SettingDiff" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "diff" JSONB NOT NULL,
    CONSTRAINT "SettingDiff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SettingDiff_shop_idx" ON "SettingDiff"("shop");
