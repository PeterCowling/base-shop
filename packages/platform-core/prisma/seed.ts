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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
