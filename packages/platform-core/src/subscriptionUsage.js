// packages/platform-core/src/subscriptionUsage.ts
import "server-only";
import { prisma } from "./db";
export async function getSubscriptionUsage(shop, customerId, month) {
    return prisma.subscriptionUsage.findUnique({
        where: { shop_customerId_month: { shop, customerId, month } },
    });
}
export async function incrementSubscriptionUsage(shop, customerId, month, count = 1) {
    await prisma.subscriptionUsage.upsert({
        where: { shop_customerId_month: { shop, customerId, month } },
        create: { shop, customerId, month, shipments: count },
        update: { shipments: { increment: count } },
    });
}
