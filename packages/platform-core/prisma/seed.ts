import { prisma } from "../src/db";
import { ulid } from "ulid";

async function main() {
  const shopId = "demo-shop";

  await prisma.shop.upsert({
    where: { id: shopId },
    update: {},
    create: { id: shopId, data: {} },
  });

  const id = ulid();
  await prisma.rentalOrder.create({
    data: {
      id,
      shopId,
      sessionId: "seed-session",
      data: {
        id,
        sessionId: "seed-session",
        shop: shopId,
        deposit: 0,
        startedAt: new Date().toISOString(),
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
