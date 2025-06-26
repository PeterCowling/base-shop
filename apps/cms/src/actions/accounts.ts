"use server";

import { USER_ROLES, type Role } from "@cms/auth/roles";
import { USERS, type CmsUser } from "@cms/auth/users";
import { sendEmail } from "@cms/lib/email";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
}

const PENDING_USERS: Record<string, PendingUser> = {};

export async function requestAccount(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const hashed = await bcrypt.hash(password, 10);
  const id = ulid();
  PENDING_USERS[id] = { id, name, email, password: hashed };
}

export function listPendingUsers(): PendingUser[] {
  return Object.values(PENDING_USERS);
}

export async function approveAccount(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const roles = formData.getAll("roles") as Role[];
  const user = PENDING_USERS[id];
  if (!user) throw new Error("pending user not found");

  const key = id;
  USERS[key] = {
    id: key,
    name: user.name,
    email: user.email,
    password: user.password,
  } satisfies CmsUser;
  USER_ROLES[key] = roles.length <= 1 ? (roles[0] as Role) : roles;
  delete PENDING_USERS[id];
  await sendEmail(
    user.email,
    "Account approved",
    "Your account has been approved"
  );
}
