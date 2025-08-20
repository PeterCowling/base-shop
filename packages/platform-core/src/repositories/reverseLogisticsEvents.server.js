import "server-only";
import { nowIso } from "@acme/date-utils";
import { prisma } from "../db.js";
export async function recordEvent(shop, sessionId, event, createdAt = nowIso()) {
    await prisma.reverseLogisticsEvent.create({
        data: { shop, sessionId, event, createdAt },
    });
}
export async function listEvents(shop) {
    return (await prisma.reverseLogisticsEvent.findMany({
        where: { shop },
        orderBy: { createdAt: "asc" },
    }));
}
export const reverseLogisticsEvents = {
    received: (shop, sessionId, createdAt = nowIso()) => recordEvent(shop, sessionId, "received", createdAt),
    cleaning: (shop, sessionId, createdAt = nowIso()) => recordEvent(shop, sessionId, "cleaning", createdAt),
    repair: (shop, sessionId, createdAt = nowIso()) => recordEvent(shop, sessionId, "repair", createdAt),
    qa: (shop, sessionId, createdAt = nowIso()) => recordEvent(shop, sessionId, "qa", createdAt),
    available: (shop, sessionId, createdAt = nowIso()) => recordEvent(shop, sessionId, "available", createdAt),
};
