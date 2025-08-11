import "server-only";
import { createUser, getUserById as coreGetUserById, getUserByEmail as coreGetUserByEmail } from "@platform-core/users";

export type { User } from "@platform-core/users";

export const getUserById = coreGetUserById;
export const getUserByEmail = coreGetUserByEmail;

export async function addUser({
  id,
  email,
  passwordHash,
  role = "customer",
}: {
  id: string;
  email: string;
  passwordHash: string;
  role?: string;
}) {
  return createUser({ id, email, passwordHash, role });
}

export async function deleteUser(id: string) {
  const { prisma } = await import("@platform-core/db");
  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    // ignore if user does not exist
  }
}


