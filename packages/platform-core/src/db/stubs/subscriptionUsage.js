"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionUsageDelegate = createSubscriptionUsageDelegate;
function createSubscriptionUsageDelegate() {
    const usages = [];
    const findIdx = (where) => usages.findIndex((u) => Object.entries(where).every(([k, v]) => u[k] === v));
    return {
        async findUnique({ where }) {
            const idx = findIdx(where);
            return idx >= 0 ? usages[idx] : null;
        },
        async upsert({ where, update, create }) {
            const idx = findIdx(where);
            if (idx >= 0) {
                usages[idx] = { ...usages[idx], ...update };
                return usages[idx];
            }
            const record = { ...create };
            usages.push(record);
            return record;
        },
    };
}
