"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerProfileDelegate = createCustomerProfileDelegate;
function createCustomerProfileDelegate() {
    const customerProfiles = [];
    return {
        findUnique: async ({ where }) => customerProfiles.find((p) => p.customerId === where.customerId) || null,
        findFirst: async ({ where, }) => {
            const email = where?.email;
            const notCustomerId = where?.NOT?.customerId;
            return (customerProfiles.find((p) => p.email === email && (!notCustomerId || p.customerId !== notCustomerId)) || null);
        },
        upsert: async ({ where, update, create, }) => {
            const idx = customerProfiles.findIndex((p) => p.customerId === where.customerId);
            if (idx >= 0) {
                customerProfiles[idx] = { ...customerProfiles[idx], ...update };
                return customerProfiles[idx];
            }
            const profile = { ...create };
            customerProfiles.push(profile);
            return profile;
        },
    };
}
