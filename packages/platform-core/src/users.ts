// packages/platform-core/src/users.ts
import "server-only";
import type { Role } from "@auth/types/roles";
import { prisma } from "./db";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  resetToken?: string | null;
}

export async function createUser(
  id: string,
  email: string,
  passwordHash: string,
  role: Role = "customer",
): Promise<User> {
  return prisma.user.create({
    data: { id, email, passwordHash, role },
  }) as unknown as User;
}

export async function getUser(id: string): Promise<User | null> {
  return (await prisma.user.findUnique({ where: { id } })) as
    | User
    | null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return (await prisma.user.findUnique({ where: { email } })) as
    | User
    | null;
}

export async function setResetToken(
  id: string,
  token: string,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { resetToken: token },
  }) as unknown as User;
}

export async function getUserByResetToken(
  token: string,
): Promise<User | null> {
  return (await prisma.user.findFirst({ where: { resetToken: token } })) as
    | User
    | null;
}

export async function updatePassword(
  id: string,
  passwordHash: string,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, resetToken: null },
  }) as unknown as User;
}
