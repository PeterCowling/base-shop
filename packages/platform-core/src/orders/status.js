"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markFulfilled = markFulfilled;
exports.markShipped = markShipped;
exports.markDelivered = markDelivered;
exports.markCancelled = markCancelled;
exports.markReturned = markReturned;
exports.setReturnTracking = setReturnTracking;
exports.setReturnStatus = setReturnStatus;
require("server-only");
const date_utils_1 = require("@acme/date-utils");
const db_1 = require("../db");
const utils_1 = require("./utils");
async function markFulfilled(shop, sessionId) {
    const order = await db_1.prisma.rentalOrder.update({
        where: { shop_sessionId: { shop, sessionId } },
        data: { fulfilledAt: (0, date_utils_1.nowIso)() },
    });
    return (0, utils_1.normalize)(order);
}
async function markShipped(shop, sessionId) {
    const order = await db_1.prisma.rentalOrder.update({
        where: { shop_sessionId: { shop, sessionId } },
        data: { shippedAt: (0, date_utils_1.nowIso)() },
    });
    return (0, utils_1.normalize)(order);
}
async function markDelivered(shop, sessionId) {
    const order = await db_1.prisma.rentalOrder.update({
        where: { shop_sessionId: { shop, sessionId } },
        data: { deliveredAt: (0, date_utils_1.nowIso)() },
    });
    return (0, utils_1.normalize)(order);
}
async function markCancelled(shop, sessionId) {
    const order = await db_1.prisma.rentalOrder.update({
        where: { shop_sessionId: { shop, sessionId } },
        data: { cancelledAt: (0, date_utils_1.nowIso)() },
    });
    return (0, utils_1.normalize)(order);
}
async function markReturned(shop, sessionId, damageFee) {
    try {
        const order = await db_1.prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: {
                returnedAt: (0, date_utils_1.nowIso)(),
                ...(typeof damageFee === "number" ? { damageFee } : {}),
            },
        });
        if (!order)
            return null;
        return (0, utils_1.normalize)(order);
    }
    catch {
        return null;
    }
}
async function setReturnTracking(shop, sessionId, trackingNumber, labelUrl) {
    try {
        const order = await db_1.prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: { trackingNumber, labelUrl },
        });
        if (!order)
            return null;
        return (0, utils_1.normalize)(order);
    }
    catch {
        return null;
    }
}
async function setReturnStatus(shop, trackingNumber, returnStatus) {
    try {
        const order = await db_1.prisma.rentalOrder.update({
            where: { shop_trackingNumber: { shop, trackingNumber } },
            data: { returnStatus },
        });
        if (!order)
            return null;
        return (0, utils_1.normalize)(order);
    }
    catch {
        return null;
    }
}
