// packages/platform-core/src/customerProfiles.ts
import type { CustomerProfile } from "@acme/types";
import { prisma } from "./db";

/**
 * Fetch a customer's profile.
 *
 * @param customerId - The identifier of the customer.
 * @returns The matching {@link CustomerProfile}.
 * @throws Error with message "Customer profile not found" when no profile exists.
 */
export async function getCustomerProfile(
  customerId: string,
): Promise<CustomerProfile> {
  const profile = await prisma.customerProfile.findUnique({ where: { customerId } });
  if (!profile) {
    throw new Error("Customer profile not found");
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
export async function updateCustomerProfile(
  customerId: string,
  data: { name: string; email: string }
): Promise<CustomerProfile> {
  const existing = await prisma.customerProfile.findFirst({
    where: {
      email: data.email,
      NOT: { customerId },
    },
  });
  if (existing && existing.customerId !== customerId) {
    throw new Error("Conflict: email already in use");
  }
  return prisma.customerProfile.upsert({
    where: { customerId },
    update: data,
    create: { customerId, ...data },
  });
}
