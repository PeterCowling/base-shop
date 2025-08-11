CREATE TABLE "CustomerAuth" (
    "customerId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "CustomerAuth_pkey" PRIMARY KEY ("customerId")
);
