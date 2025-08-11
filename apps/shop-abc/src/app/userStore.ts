// apps/shop-abc/src/app/userStore.ts
import "server-only";
import {
  createUser,
  getUserById as dbGetUserById,
  getUserByEmail as dbGetUserByEmail,
  setResetToken as dbSetResetToken,
  updatePassword as dbUpdatePassword,
} from "@platform-core/users";

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

export const getUserById = dbGetUserById;
export const getUserByEmail = dbGetUserByEmail;
export const setResetToken = dbSetResetToken;
export const updatePassword = dbUpdatePassword;
