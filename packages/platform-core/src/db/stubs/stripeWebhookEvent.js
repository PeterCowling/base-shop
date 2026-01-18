"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeWebhookEventDelegate = createStripeWebhookEventDelegate;
function createStripeWebhookEventDelegate() {
    const rows = new Map();
    return {
        async findUnique({ where }) {
            const row = rows.get(where.id);
            return row ? { ...row } : null;
        },
        async upsert({ where, create, update, }) {
            const existing = rows.get(where.id);
            const now = new Date();
            if (existing) {
                const next = {
                    ...existing,
                    ...update,
                    updatedAt: now,
                };
                rows.set(where.id, next);
                return { ...next };
            }
            const created = {
                ...create,
                createdAt: create.createdAt ?? now,
                updatedAt: create.updatedAt ?? now,
            };
            rows.set(where.id, created);
            return { ...created };
        },
        async deleteMany({ where, } = {}) {
            const cutoff = where?.createdAt?.lt;
            if (!cutoff)
                return { count: 0 };
            let count = 0;
            for (const [id, row] of rows.entries()) {
                const createdAt = row.createdAt ?? row.updatedAt ?? new Date();
                if (createdAt.getTime() < cutoff.getTime()) {
                    rows.delete(id);
                    count += 1;
                }
            }
            return { count };
        },
    };
}
