// packages/auth/src/mfa.ts
import { authenticator } from "otplib";
import { prisma } from "@acme/platform-core/db";
import type { CustomerMfa } from "@acme/types";
import { randomInt } from "crypto";

const SECRET_BYTES = 20;

export interface MfaEnrollment {
  secret: string;
  otpauth: string;
}

export async function enrollMfa(customerId: string): Promise<MfaEnrollment> {
  // otplib's default secret length yields only 16 base32 characters which
  // can be too short for some authenticators. Generate 20 bytes instead so
  // the resulting base32 string is 32 characters long.
  const secret = authenticator.generateSecret(SECRET_BYTES);
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
  // Use the shared authenticator and pass a ±1 step window explicitly.
  // Types for `otplib` may not include `window`, but runtime supports it.
  // Cast through `unknown` to the function's first parameter type to avoid `any`.
  const opts = {
    token,
    secret: record.secret,
    window: 1,
  } as unknown as Parameters<typeof authenticator.verify>[0];
  const valid = authenticator.verify(opts);
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

export async function deactivateMfa(customerId: string): Promise<void> {
  await prisma.customerMfa.update({
    where: { customerId },
    data: { secret: null, enabled: false },
  });
}

export interface MfaToken {
  token: string;
  expiresAt: Date;
}

const DEFAULT_MFA_TOKEN_TTL_MS = 60_000;

export function generateMfaToken(ttlMs = DEFAULT_MFA_TOKEN_TTL_MS): MfaToken {
  const token = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return { token, expiresAt: new Date(Date.now() + ttlMs) };
}

export function verifyMfaToken(token: string, data: MfaToken): boolean {
  return token === data.token && Date.now() < data.expiresAt.getTime();
}
