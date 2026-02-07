// packages/platform-core/src/repositories/subscriptions.server.ts
import "server-only";

import { prisma } from "../db";

export async function updateSubscriptionPaymentStatus(
  customerId: string,
  subscriptionId: string,
  _status: "succeeded" | "failed",
): Promise<void> {
  await prisma.user.update({
    where: { id: customerId },
    data: {
      stripeSubscriptionId: subscriptionId,
    },
  });
}

export async function syncSubscriptionData(
  customerId: string,
  subscriptionId: string | null,
): Promise<void> {
  await prisma.user.update({
    where: { id: customerId },
    data: { stripeSubscriptionId: subscriptionId },
  });
}
