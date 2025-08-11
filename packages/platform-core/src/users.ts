// packages/platform-core/src/users.ts
import "server-only";
import { prisma } from "./db";
import type { Role } from "@auth/types/roles";

export interface User {
  customerId: string;
  email: string;
  password: string; // hashed password
  role: Role;
}

export async function getUser(customerId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { customerId } });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
  customerId: string;
  email: string;
  password: string;
  role: Role;
}): Promise<User> {
  return prisma.user.create({ data });
}

export async function updateUserPassword(
  customerId: string,
  password: string,
): Promise<User> {
  return prisma.user.update({ where: { customerId }, data: { password } });
}
