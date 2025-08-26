// apps/cms/src/actions/accounts.ts

"use server";

import type { Role } from "@cms/auth/roles";
import type { CmsUser } from "@cms/auth/users";
import argon2 from "argon2";
import { ulid } from "ulid";
import { sendEmail } from "@acme/email";
import { readRbac, writeRbac } from "../lib/rbacStore";

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
  const hashOpts =
    process.env.NODE_ENV === "test"
      ? { timeCost: 1, memoryCost: 2 ** 8, parallelism: 1 }
      : undefined;
  const hashed = await argon2.hash(password, hashOpts);
  const id = ulid();
  PENDING_USERS[id] = { id, name, email, password: hashed };
}

export async function listPendingUsers(): Promise<PendingUser[]> {
  return Object.values(PENDING_USERS);
}

export async function approveAccount(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const roles = formData.getAll("roles") as Role[];
  const user = PENDING_USERS[id];
  if (!user) throw new Error("pending user not found");

  const db = await readRbac();
  db.users[user.id] = {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
  } satisfies CmsUser;
  db.roles[user.id] = roles.length <= 1 ? (roles[0] as Role) : roles;
  await writeRbac(db);
  delete PENDING_USERS[id];
  await sendEmail(
    user.email,
    "Account approved",
    "Your account has been approved"
  );
}
