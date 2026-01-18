"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRentalOrderDelegate = createRentalOrderDelegate;
function hasShopSessionIdWhere(where) {
    return (typeof where === "object" &&
        where !== null &&
        Object.prototype.hasOwnProperty.call(where, "shop_sessionId") &&
        typeof where.shop_sessionId === "object" &&
        where.shop_sessionId !== null);
}
function hasShopTrackingNumberWhere(where) {
    return (typeof where === "object" &&
        where !== null &&
        Object.prototype.hasOwnProperty.call(where, "shop_trackingNumber") &&
        typeof where.shop_trackingNumber === "object" &&
        where.shop_trackingNumber !== null);
}
function createRentalOrderDelegate() {
    const rentalOrders = [];
    return {
        async findMany({ where } = {}) {
            return rentalOrders.filter((o) => {
                if (!where)
                    return true;
                if (where.shop && o.shop !== where.shop)
                    return false;
                if (where.customerId && o.customerId !== where.customerId)
                    return false;
                if (typeof where.stripePaymentIntentId === "string" &&
                    o.stripePaymentIntentId !== where.stripePaymentIntentId)
                    return false;
                return true;
            });
        },
        async findUnique({ where }) {
            if (hasShopSessionIdWhere(where)) {
                const { shop, sessionId } = where.shop_sessionId;
                return (rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId) ||
                    null);
            }
            if (hasShopTrackingNumberWhere(where)) {
                // The stub intentionally refuses lookups by tracking number so that
                // tests exercise the update path guarded by this key.
                return null;
            }
            return null;
        },
        async create({ data }) {
            rentalOrders.push({ ...data });
            return data;
        },
        async update({ where, data }) {
            let order;
            if (hasShopSessionIdWhere(where)) {
                const { shop, sessionId } = where.shop_sessionId;
                order = rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId);
            }
            else if (hasShopTrackingNumberWhere(where)) {
                const { shop, trackingNumber } = where.shop_trackingNumber;
                order = rentalOrders.find((o) => o.shop === shop && o.trackingNumber === trackingNumber);
            }
            if (!order)
                throw new Error("Order not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
            Object.assign(order, data);
            return order;
        },
        async updateMany({ where, data }) {
            let count = 0;
            for (const order of rentalOrders) {
                if (where?.shop && order.shop !== where.shop)
                    continue;
                if (typeof where?.stripePaymentIntentId === "string" &&
                    order.stripePaymentIntentId !== where.stripePaymentIntentId)
                    continue;
                Object.assign(order, data);
                count += 1;
            }
            return { count };
        },
    };
}
