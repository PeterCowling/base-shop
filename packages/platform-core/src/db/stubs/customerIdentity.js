"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerIdentityDelegate = createCustomerIdentityDelegate;
const crypto_1 = require("crypto");
function createCustomerIdentityDelegate() {
    const rows = [];
    return {
        findUnique: async ({ where }) => {
            if (where.id) {
                return rows.find((row) => row.id === where.id) ?? null;
            }
            if (where.internalCustomerId) {
                return (rows.find((row) => row.internalCustomerId === where.internalCustomerId) ?? null);
            }
            if (where.issuer_subject) {
                const { issuer, subject } = where.issuer_subject;
                return (rows.find((row) => row.issuer === issuer && row.subject === subject) ?? null);
            }
            return null;
        },
        create: async ({ data }) => {
            if (rows.some((row) => row.issuer === data.issuer && row.subject === data.subject) ||
                rows.some((row) => row.internalCustomerId === data.internalCustomerId)) {
                throw new Error("Unique constraint failed"); // i18n-exempt: test-only stub error
            }
            const now = new Date();
            const record = {
                id: data.id ?? (0, crypto_1.randomUUID)(),
                issuer: data.issuer,
                subject: data.subject,
                internalCustomerId: data.internalCustomerId,
                createdAt: data.createdAt ?? now,
                updatedAt: data.updatedAt ?? now,
            };
            rows.push(record);
            return record;
        },
    };
}
