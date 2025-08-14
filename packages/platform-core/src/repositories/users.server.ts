// packages/platform-core/src/repositories/users.server.ts
import "server-only";

export * from "../users";

import { prisma } from "../db";

export async function setStripeSubscriptionId(
  id: string,
  subscriptionId: string | null,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { stripeSubscriptionId: subscriptionId },
  });
}
