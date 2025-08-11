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
