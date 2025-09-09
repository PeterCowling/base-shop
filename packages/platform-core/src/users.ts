// packages/platform-core/src/users.ts
import "server-only";
import { prisma } from "./db";
import type { User } from "@acme/types";

export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export async function getUserByEmail(email: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
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
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });
  return user ?? null;
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
