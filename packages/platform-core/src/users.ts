// packages/platform-core/src/users.ts
import { prisma } from "./db";

export interface User {
  email: string;
  passwordHash: string;
  role: string;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(
  email: string,
  passwordHash: string,
  role: string,
): Promise<void> {
  await prisma.user.create({ data: { email, passwordHash, role } });
}

export async function updateUserPassword(
  email: string,
  passwordHash: string,
): Promise<void> {
  await prisma.user.update({ where: { email }, data: { passwordHash } });
}
