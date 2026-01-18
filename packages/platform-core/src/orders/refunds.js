"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markRefunded = markRefunded;
exports.refundOrder = refundOrder;
require("server-only");
const date_utils_1 = require("@acme/date-utils");
const stripe_1 = require("@acme/stripe");
const db_1 = require("../db");
const utils_1 = require("./utils");
async function markRefunded(shop, sessionId, riskLevel, riskScore, flaggedForReview) {
    try {
        const order = await db_1.prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: {
                refundedAt: (0, date_utils_1.nowIso)(),
                ...(riskLevel ? { riskLevel } : {}),
                ...(typeof riskScore === "number" ? { riskScore } : {}),
                ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
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
async function refundOrder(shop, sessionId, amount) {
    const order = await db_1.prisma.rentalOrder.findUnique({
        where: { shop_sessionId: { shop, sessionId } },
    });
    if (!order)
        return null;
    const alreadyRefunded = order.refundTotal ?? 0;
    const total = order.total ??
        order.deposit ??
        (typeof amount === "number" ? amount : 0);
    const remaining = Math.max(total - alreadyRefunded, 0);
    const requested = typeof amount === "number" ? amount : remaining;
    const refundable = Math.min(requested, remaining);
    if (refundable > 0) {
        const session = await stripe_1.stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["payment_intent"],
        });
        const pi = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        if (!pi) {
            throw new Error("payment_intent missing"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
        }
        await stripe_1.stripe.refunds.create({
            payment_intent: pi,
            amount: Math.round(refundable * 100),
        });
    }
    try {
        const updated = await db_1.prisma.rentalOrder.update({
            where: { shop_sessionId: { shop, sessionId } },
            data: {
                refundedAt: (0, date_utils_1.nowIso)(),
                refundTotal: alreadyRefunded + refundable,
            },
        });
        if (!updated)
            return null;
        return (0, utils_1.normalize)(updated);
    }
    catch {
        return null;
    }
}
