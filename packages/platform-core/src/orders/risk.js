"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNeedsAttention = markNeedsAttention;
exports.updateRisk = updateRisk;
require("server-only");
const db_1 = require("../db");
const utils_1 = require("./utils");
async function markNeedsAttention(shop, sessionId) {
    try {
        const order = await db_1.prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: { flaggedForReview: true },
        });
        return order ? (0, utils_1.normalize)(order) : null;
    }
    catch {
        return null;
    }
}
async function updateRisk(shop, sessionId, riskLevel, riskScore, flaggedForReview) {
    try {
        const order = await db_1.prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: {
                ...(riskLevel ? { riskLevel } : {}),
                ...(typeof riskScore === "number" ? { riskScore } : {}),
                ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
            },
        });
        return order ? (0, utils_1.normalize)(order) : null;
    }
    catch {
        return null;
    }
}
