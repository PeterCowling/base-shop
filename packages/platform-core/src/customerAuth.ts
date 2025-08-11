// packages/platform-core/src/customerAuth.ts
import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export interface CustomerAuthRecord {
  customerId: string;
  password: string;
  role: string;
}

export async function registerCustomer(
  customerId: string,
  password: string,
  role: string,
): Promise<CustomerAuthRecord> {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.customerAuth.upsert({
    where: { customerId },
    update: { password: hashed, role },
    create: { customerId, password: hashed, role },
  });
}

export async function getCustomerAuth(
  customerId: string,
): Promise<CustomerAuthRecord | null> {
  return prisma.customerAuth.findUnique({ where: { customerId } });
}
