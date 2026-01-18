"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionUsage = getSubscriptionUsage;
exports.incrementSubscriptionUsage = incrementSubscriptionUsage;
// packages/platform-core/src/subscriptionUsage.ts
require("server-only");
const db_1 = require("./db");
async function getSubscriptionUsage(shop, customerId, month) {
    return db_1.prisma.subscriptionUsage.findUniqueOrThrow({
        where: { shop_customerId_month: { shop, customerId, month } },
    });
}
async function incrementSubscriptionUsage(shop, customerId, month, count) {
    const shipments = count ?? 1;
    await db_1.prisma.subscriptionUsage.upsert({
        where: { shop_customerId_month: { shop, customerId, month } },
        create: { shop, customerId, month, shipments },
        update: { shipments: { increment: shipments } },
    });
}
