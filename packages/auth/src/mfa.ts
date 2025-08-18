// packages/auth/src/mfa.ts
import { authenticator } from "otplib";
import { prisma } from "@acme/platform-core/db";

export interface MfaEnrollment {
  secret: string;
  otpauth: string;
}

export async function enrollMfa(customerId: string): Promise<MfaEnrollment> {
  const secret = authenticator.generateSecret();
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
  const record = await prisma.customerMfa.findUnique({ where: { customerId } });
  if (!record) return false;
  const valid = authenticator.verify({ token, secret: record.secret });
  if (valid && !record.enabled) {
    await prisma.customerMfa.update({
      where: { customerId },
      data: { enabled: true },
    });
  }
  return valid;
}

export async function isMfaEnabled(customerId: string): Promise<boolean> {
  const record = await prisma.customerMfa.findUnique({ where: { customerId } });
  return record?.enabled ?? false;
}
