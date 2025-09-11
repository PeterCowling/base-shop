// packages/auth/src/mfa.ts
import { authenticator } from "otplib";
import { prisma } from "@acme/platform-core/db";
import type { CustomerMfa } from "@acme/types";

export interface MfaEnrollment {
  secret: string;
  otpauth: string;
}

export async function enrollMfa(customerId: string): Promise<MfaEnrollment> {
  // otplib's default secret length yields only 16 base32 characters which
  // can be too short for some authenticators. Generate 20 bytes instead so
  // the resulting base32 string is 32 characters long.
  const secret = authenticator.generateSecret(20);
  await prisma.customerMfa.upsert({
    where: { customerId },
    update: { secret },
    create: { customerId, secret, enabled: false },
  });
  const otpauth = authenticator.keyuri(customerId, "Acme", secret);
  return { secret, otpauth };
}

export async function verifyMfa(
  customerId: string,
  token: string
): Promise<boolean> {
  const record: CustomerMfa | null = await prisma.customerMfa.findUnique({
    where: { customerId },
  });
  if (!record) return false;
  const valid = authenticator.verify({ token, secret: record.secret, window: 1 });
  if (valid && !record.enabled) {
    await prisma.customerMfa.update({
      where: { customerId },
      data: { enabled: true },
    });
  }
  return valid;
}

export async function isMfaEnabled(customerId: string): Promise<boolean> {
  const record: CustomerMfa | null = await prisma.customerMfa.findUnique({
    where: { customerId },
  });
  return record?.enabled ?? false;
}
