import { prisma } from "../src/db";
import { nowIso } from "@acme/date-utils";

async function main() {
  await prisma.rentalOrder.createMany({
    data: [
      {
        id: "seed-order-1",
        shop: "seed-shop",
        sessionId: "seed-session",
        deposit: 0,
        startedAt: nowIso(),
      },
    ],
    skipDuplicates: true,
  });

  if (!process.env.SKIP_INVENTORY_SEED) {
    await prisma.inventoryItem.createMany({
      data: [
        {
          id: "seed-inventory-1",
          shopId: "seed-shop",
          sku: "SKU1",
          productId: "seed-product",
          quantity: 10,
          variantAttributes: {},
          variantKey: "SKU1",
        },
      ],
      skipDuplicates: true,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
