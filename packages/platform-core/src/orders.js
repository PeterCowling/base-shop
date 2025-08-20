// packages/platform-core/src/orders.ts
import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import { trackOrder } from "./analytics";
import { prisma } from "./db";
import { incrementSubscriptionUsage } from "./subscriptionUsage";
function normalize(order) {
    const o = { ...order };
    Object.keys(o).forEach((k) => {
        if (o[k] === null)
            o[k] = undefined;
    });
    return o;
}
export async function listOrders(shop) {
    const orders = await prisma.rentalOrder.findMany({ where: { shop } });
    return orders.map(normalize);
}
export const readOrders = listOrders;
export async function addOrder(shop, sessionId, deposit, expectedReturnDate, returnDueDate, customerId, riskLevel, riskScore, flaggedForReview) {
    const order = {
        id: ulid(),
        sessionId,
        shop,
        deposit,
        expectedReturnDate,
        returnDueDate,
        startedAt: nowIso(),
        ...(customerId ? { customerId } : {}),
        ...(riskLevel ? { riskLevel } : {}),
        ...(typeof riskScore === "number" ? { riskScore } : {}),
        ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
    };
    await prisma.rentalOrder.create({ data: order });
    await trackOrder(shop, order.id, deposit);
    if (customerId) {
        const month = nowIso().slice(0, 7);
        const record = await prisma.shop.findUnique({
            select: { data: true },
            where: { id: shop },
        });
        const shopData = record?.data;
        if (shopData?.subscriptionsEnabled) {
            await incrementSubscriptionUsage(shop, customerId, month);
        }
    }
    return order;
}
export async function markReturned(shop, sessionId, damageFee) {
    try {
        const order = await prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: {
                returnedAt: nowIso(),
                ...(typeof damageFee === "number" ? { damageFee } : {}),
            },
        });
        return order;
    }
    catch {
        return null;
    }
}
export async function markRefunded(shop, sessionId, riskLevel, riskScore, flaggedForReview) {
    try {
        const order = await prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: {
                refundedAt: nowIso(),
                ...(riskLevel ? { riskLevel } : {}),
                ...(typeof riskScore === "number" ? { riskScore } : {}),
                ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
            },
        });
        return order;
    }
    catch {
        return null;
    }
}
export async function updateRisk(shop, sessionId, riskLevel, riskScore, flaggedForReview) {
    try {
        const order = await prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: {
                ...(riskLevel ? { riskLevel } : {}),
                ...(typeof riskScore === "number" ? { riskScore } : {}),
                ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
            },
        });
        return order;
    }
    catch {
        return null;
    }
}
export async function getOrdersForCustomer(shop, customerId) {
    const orders = await prisma.rentalOrder.findMany({
        where: { shop, customerId },
    });
    return orders.map(normalize);
}
export async function setReturnTracking(shop, sessionId, trackingNumber, labelUrl) {
    try {
        const order = await prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: { trackingNumber, labelUrl },
        });
        return order;
    }
    catch {
        return null;
    }
}
export async function setReturnStatus(shop, trackingNumber, returnStatus) {
    try {
        const order = await prisma.rentalOrder.update({
            where: { shop_trackingNumber: { shop, trackingNumber } },
            data: { returnStatus },
        });
        return order;
    }
    catch {
        return null;
    }
}
