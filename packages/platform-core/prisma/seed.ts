import { prisma } from "../src/db";

async function main() {
  await prisma.rentalOrder.createMany({
    data: [
      {
        id: "seed-order-1",
        shop: "seed-shop",
        sessionId: "seed-session",
        deposit: 0,
        startedAt: new Date().toISOString(),
      },
    ],
    skipDuplicates: true,
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
