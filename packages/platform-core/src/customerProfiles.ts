// packages/platform-core/src/customerProfiles.ts
import "server-only";
import { prisma } from "./db";

export interface CustomerProfile {
  customerId: string;
  name: string;
  email: string;
}

export async function getCustomerProfile(customerId: string): Promise<CustomerProfile | null> {
  return prisma.customerProfile.findUnique({ where: { customerId } });
}

export async function updateCustomerProfile(
  customerId: string,
  data: { name: string; email: string }
): Promise<CustomerProfile> {
  return prisma.customerProfile.upsert({
    where: { customerId },
    update: data,
    create: { customerId, ...data },
  });
}
