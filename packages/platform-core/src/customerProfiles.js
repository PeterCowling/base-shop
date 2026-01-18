"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerProfile = getCustomerProfile;
exports.updateCustomerProfile = updateCustomerProfile;
const db_1 = require("./db");
/**
 * Fetch a customer's profile.
 *
 * @param customerId - The identifier of the customer.
 * @returns The matching {@link CustomerProfile}.
 * @throws Error with message "Customer profile not found" when no profile exists.
 */
async function getCustomerProfile(customerId) {
    const profile = await db_1.prisma.customerProfile.findUnique({ where: { customerId } });
    if (!profile) {
        throw new Error("Customer profile not found"); // i18n-exempt -- backend error string; API layer maps to localized message
    }
    return profile;
}
/**
 * Create or update a customer's profile.
 *
 * @param customerId - The identifier of the customer.
 * @param data - The profile fields to set.
 * @returns The upserted {@link CustomerProfile}.
 * @throws Error with message "Conflict: email already in use" when another profile uses the email.
 */
async function updateCustomerProfile(customerId, data) {
    const existing = await db_1.prisma.customerProfile.findFirst({
        where: {
            email: data.email,
            NOT: { customerId },
        },
    });
    if (existing && existing.customerId !== customerId) {
        throw new Error("Conflict: email already in use"); // i18n-exempt -- backend error string; API layer maps to localized message
    }
    return db_1.prisma.customerProfile.upsert({
        where: { customerId },
        update: data,
        create: { customerId, ...data },
    });
}
