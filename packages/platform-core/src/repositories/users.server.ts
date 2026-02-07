// packages/platform-core/src/repositories/users.server.ts
import "server-only";

import { prisma } from "../db";

import { readShop } from "./shops.server";

export * from "../users";

export async function setStripeSubscriptionId(
  id: string,
  subscriptionId: string | null,
  shopId: string,
): Promise<void> {
  const shop = await readShop(shopId);
  if (!shop.subscriptionsEnabled) return;

  await prisma.user.update({
    where: { id },
    data: { stripeSubscriptionId: subscriptionId },
  });
}
