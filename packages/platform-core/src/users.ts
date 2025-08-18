// packages/platform-core/src/users.ts
import "server-only";
import { prisma } from "./db.js";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  resetToken: string | null;
  resetTokenExpiresAt: Date | null;
  emailVerified: boolean;
  stripeSubscriptionId?: string | null;
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser({
  id,
  email,
  passwordHash,
  role = "customer",
  emailVerified = false,
}: {
  id: string;
  email: string;
  passwordHash: string;
  role?: string;
  emailVerified?: boolean;
}): Promise<User> {
  return prisma.user.create({
    data: { id, email, passwordHash, role, emailVerified },
  });
}

export async function setResetToken(
  id: string,
  token: string | null,
  expiresAt: Date | null,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { resetToken: token, resetTokenExpiresAt: expiresAt },
  });
}

export async function getUserByResetToken(
  token: string,
): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });
}

export async function updatePassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}

export async function verifyEmail(id: string): Promise<void> {
  await prisma.user.update({ where: { id }, data: { emailVerified: true } });
}
