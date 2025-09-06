// packages/platform-core/src/customerProfiles.ts
import type { CustomerProfile } from "@acme/types";
import { prisma } from "./db";

export async function getCustomerProfile(customerId: string): Promise<CustomerProfile> {
  const profile = await prisma.customerProfile.findUnique({ where: { customerId } });
  if (!profile) {
    throw new Error("Customer profile not found");
  }
  return profile;
}

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
  if (existing) {
    throw new Error("Conflict: email already in use");
  }
  return prisma.customerProfile.upsert({
    where: { customerId },
    update: data,
    create: { customerId, ...data },
  });
}
