"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readOrders = void 0;
exports.listOrders = listOrders;
exports.addOrder = addOrder;
exports.getOrdersForCustomer = getOrdersForCustomer;
require("server-only");
const ulid_1 = require("ulid");
const date_utils_1 = require("@acme/date-utils");
const analytics_1 = require("../analytics");
const db_1 = require("../db");
const subscriptionUsage_1 = require("../subscriptionUsage");
const utils_1 = require("./utils");
function isPrismaUniqueConstraintError(err) {
    return (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DS-0001 Prisma error is intentionally treated as an untyped runtime value
        err.code === "P2002");
}
async function listOrders(shop) {
    const orders = (await db_1.prisma.rentalOrder.findMany({
        where: { shop },
    }));
    return orders.map((order) => (0, utils_1.normalize)(order));
}
exports.readOrders = listOrders;
async function addOrder(input) {
    const { orderId, shop, sessionId, deposit, expectedReturnDate, returnDueDate, customerId, riskLevel, riskScore, flaggedForReview, currency, subtotalAmount, taxAmount, shippingAmount, discountAmount, totalAmount, cartId, stripePaymentIntentId, stripeChargeId, stripeBalanceTransactionId, stripeCustomerId, } = input;
    const order = {
        id: orderId ?? (0, ulid_1.ulid)(),
        sessionId,
        shop,
        deposit,
        startedAt: (0, date_utils_1.nowIso)(),
        ...(expectedReturnDate ? { expectedReturnDate } : {}),
        ...(returnDueDate ? { returnDueDate } : {}),
        ...(customerId ? { customerId } : {}),
        ...(riskLevel ? { riskLevel } : {}),
        ...(typeof riskScore === "number" ? { riskScore } : {}),
        ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
        ...(currency ? { currency } : {}),
        ...(typeof subtotalAmount === "number" ? { subtotalAmount } : {}),
        ...(typeof taxAmount === "number" ? { taxAmount } : {}),
        ...(typeof shippingAmount === "number" ? { shippingAmount } : {}),
        ...(typeof discountAmount === "number" ? { discountAmount } : {}),
        ...(typeof totalAmount === "number" ? { totalAmount } : {}),
        ...(cartId ? { cartId } : {}),
        ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
        ...(stripeChargeId ? { stripeChargeId } : {}),
        ...(stripeBalanceTransactionId ? { stripeBalanceTransactionId } : {}),
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
    };
    try {
        await db_1.prisma.rentalOrder.create({
            data: order,
        });
    }
    catch (err) {
        if (isPrismaUniqueConstraintError(err)) {
            const updated = (await db_1.prisma.rentalOrder.update({
                where: { shop_sessionId: { shop, sessionId } },
                data: {
                    deposit,
                    ...(expectedReturnDate ? { expectedReturnDate } : {}),
                    ...(returnDueDate ? { returnDueDate } : {}),
                    ...(customerId ? { customerId } : {}),
                    ...(riskLevel ? { riskLevel } : {}),
                    ...(typeof riskScore === "number" ? { riskScore } : {}),
                    ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
                    ...(currency ? { currency } : {}),
                    ...(typeof subtotalAmount === "number" ? { subtotalAmount } : {}),
                    ...(typeof taxAmount === "number" ? { taxAmount } : {}),
                    ...(typeof shippingAmount === "number" ? { shippingAmount } : {}),
                    ...(typeof discountAmount === "number" ? { discountAmount } : {}),
                    ...(typeof totalAmount === "number" ? { totalAmount } : {}),
                    ...(cartId ? { cartId } : {}),
                    ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
                    ...(stripeChargeId ? { stripeChargeId } : {}),
                    ...(stripeBalanceTransactionId
                        ? { stripeBalanceTransactionId }
                        : {}),
                    ...(stripeCustomerId ? { stripeCustomerId } : {}),
                },
            }));
            if (updated)
                return (0, utils_1.normalize)(updated);
        }
        throw err;
    }
    await (0, analytics_1.trackOrder)(shop, order.id, deposit);
    if (customerId) {
        const month = (0, date_utils_1.nowIso)().slice(0, 7);
        const record = await db_1.prisma.shop.findUnique({
            select: { data: true },
            where: { id: shop },
        });
        const shopData = record?.data;
        if (shopData?.subscriptionsEnabled) {
            await (0, subscriptionUsage_1.incrementSubscriptionUsage)(shop, customerId, month);
        }
    }
    return order;
}
async function getOrdersForCustomer(shop, customerId) {
    const orders = (await db_1.prisma.rentalOrder.findMany({
        where: { shop, customerId },
    }));
    return orders.map((order) => (0, utils_1.normalize)(order));
}
