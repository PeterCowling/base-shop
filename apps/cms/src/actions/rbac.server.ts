// apps/cms/src/actions/rbac.ts
"use server";

import type { Role } from "@cms/auth/roles";
import type { CmsUser } from "@cms/auth/users";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";
import { readRbac, writeRbac } from "../lib/rbacStore";

export interface UserWithRoles extends CmsUser {
  roles: Role | Role[];
}

export async function listUsers(): Promise<UserWithRoles[]> {
  const db = await readRbac();
  return Object.values(db.users).map((u) => ({ ...u, roles: db.roles[u.id] }));
}

export async function updateUserRoles(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const roles = formData.getAll("roles") as Role[];
  const db = await readRbac();
  if (!db.users[id]) throw new Error("user not found");
  db.roles[id] = roles.length <= 1 ? (roles[0] as Role) : roles;
  await writeRbac(db);
}

export async function inviteUser(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const roles = formData.getAll("roles") as Role[];

  const hashed = await bcrypt.hash(password, 10);
  const id = ulid();
  const db = await readRbac();
  db.users[id] = { id, name, email, password: hashed };
  db.roles[id] = roles.length <= 1 ? (roles[0] as Role) : roles;
  await writeRbac(db);
}
