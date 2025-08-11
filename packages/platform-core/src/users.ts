// packages/platform-core/src/users.ts
import "server-only";
import { prisma } from "./db";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  resetToken: string | null;
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
}: {
  id: string;
  email: string;
  passwordHash: string;
  role?: string;
}): Promise<User> {
  return prisma.user.create({
    data: { id, email, passwordHash, role },
  });
}

export async function setResetToken(id: string, token: string | null): Promise<void> {
  await prisma.user.update({ where: { id }, data: { resetToken: token } });
}

export async function getUserByResetToken(
  token: string,
): Promise<User | null> {
  return prisma.user.findFirst({ where: { resetToken: token } });
}

export async function updatePassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { passwordHash, resetToken: null },
  });
}
