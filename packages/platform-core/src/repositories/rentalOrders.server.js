// packages/platform-core/src/repositories/rentalOrders.server.ts
import "server-only";
import { nowIso } from "@acme/date-utils";
import { prisma } from "../db.js";
export { listOrders as readOrders, addOrder, markReturned, markRefunded, updateRisk, setReturnTracking, } from "../orders.js";
async function updateStatus(shop, sessionId, status, extra = {}) {
    try {
        const order = await prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: { status, ...extra },
        });
        return order;
    }
    catch {
        return null;
    }
}
export const markReceived = (shop, sessionId) => updateStatus(shop, sessionId, "received", { returnReceivedAt: nowIso() });
export const markCleaning = (shop, sessionId) => updateStatus(shop, sessionId, "cleaning");
export const markRepair = (shop, sessionId) => updateStatus(shop, sessionId, "repair");
export const markQa = (shop, sessionId) => updateStatus(shop, sessionId, "qa");
export const markAvailable = (shop, sessionId) => updateStatus(shop, sessionId, "available");
export async function markLateFeeCharged(shop, sessionId, amount) {
    try {
        const order = await prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: { lateFeeCharged: amount },
        });
        return order;
    }
    catch {
        return null;
    }
}
