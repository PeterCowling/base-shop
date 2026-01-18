"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerStripeMappingDelegate = createCustomerStripeMappingDelegate;
const crypto_1 = require("crypto");
function createCustomerStripeMappingDelegate() {
    const rows = [];
    return {
        findUnique: async ({ where, }) => {
            if (where.id) {
                return rows.find((row) => row.id === where.id) ?? null;
            }
            if (where.internalCustomerId_environment) {
                const { internalCustomerId, environment } = where.internalCustomerId_environment;
                return (rows.find((row) => row.internalCustomerId === internalCustomerId &&
                    row.environment === environment) ?? null);
            }
            if (where.stripeCustomerId_environment) {
                const { stripeCustomerId, environment } = where.stripeCustomerId_environment;
                return (rows.find((row) => row.stripeCustomerId === stripeCustomerId &&
                    row.environment === environment) ?? null);
            }
            return null;
        },
        create: async ({ data }) => {
            const conflict = rows.some((row) => (row.internalCustomerId === data.internalCustomerId &&
                row.environment === data.environment) ||
                (row.stripeCustomerId === data.stripeCustomerId &&
                    row.environment === data.environment));
            if (conflict) {
                throw new Error("Unique constraint failed"); // i18n-exempt: test-only stub error
            }
            const now = new Date();
            const record = {
                id: data.id ?? (0, crypto_1.randomUUID)(),
                internalCustomerId: data.internalCustomerId,
                stripeCustomerId: data.stripeCustomerId,
                environment: data.environment,
                createdAt: data.createdAt ?? now,
                updatedAt: data.updatedAt ?? now,
            };
            rows.push(record);
            return record;
        },
    };
}
