"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerMfaDelegate = void 0;
exports.createCustomerMfaDelegate = createCustomerMfaDelegate;
function createCustomerMfaDelegate() {
    const customerMfas = [];
    return {
        upsert: async ({ where, update, create }) => {
            const idx = customerMfas.findIndex((m) => m.customerId === where.customerId);
            if (idx >= 0) {
                customerMfas[idx] = { ...customerMfas[idx], ...update };
                return customerMfas[idx];
            }
            const record = { ...create };
            customerMfas.push(record);
            return record;
        },
        findUnique: async ({ where }) => customerMfas.find((m) => m.customerId === where.customerId) || null,
        update: async ({ where, data }) => {
            const idx = customerMfas.findIndex((m) => m.customerId === where.customerId);
            if (idx < 0)
                throw new Error("CustomerMfa not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
            customerMfas[idx] = { ...customerMfas[idx], ...data };
            return customerMfas[idx];
        },
    };
}
exports.customerMfaDelegate = createCustomerMfaDelegate();
