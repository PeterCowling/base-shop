import type { Role } from "@auth/types/roles";
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";

export interface UserRecord {
  password: string;
  role: Role;
  email: string;
  resetToken?: string;
}

const DEFAULT_USERS: Record<string, UserRecord> = {
  cust1: {
    password: "$2b$10$vxwDn1x/rWxGtaGnpWNQbuLNHqnnVyzmTb.9wQ6/t8zsPqP5VM/XG",
    role: "customer",
    email: "cust1@example.com",
  },
  viewer1: {
    password: "$2b$10$ch.MKZ4DOiWY/Ad6oVPUKuV.WJisqMU8D0EQIdeUm2sqY7IiW3DLC",
    role: "viewer",
    email: "viewer1@example.com",
  },
  admin1: {
    password: "$2b$10$I9IVpZpVTfUrLnyh33tQO.85L7bmrhSLnkeS2oZWL8r2AzJTdglSq",
    role: "admin",
    email: "admin1@example.com",
  },
};

function resolveFile(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops", "abc");
    if (fsSync.existsSync(candidate)) {
      return path.join(candidate, "users.json");
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops", "abc", "users.json");
}

const FILE = resolveFile();

async function readUsers(): Promise<Record<string, UserRecord>> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(buf) as Record<string, UserRecord>;
    if (parsed) return parsed;
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_USERS };
}

async function writeUsers(db: Record<string, UserRecord>): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export async function getUser(id: string): Promise<UserRecord | undefined> {
  const users = await readUsers();
  return users[id];
}

export async function addUser(
  id: string,
  email: string,
  password: string,
): Promise<void> {
  const users = await readUsers();
  users[id] = { password, role: "customer", email };
  await writeUsers(users);
}

export async function findUserByEmail(
  email: string,
): Promise<[string, UserRecord] | undefined> {
  const users = await readUsers();
  return Object.entries(users).find(([, u]) => u.email === email);
}

export async function updateUser(
  id: string,
  patch: Partial<UserRecord>,
): Promise<void> {
  const users = await readUsers();
  if (!users[id]) return;
  users[id] = { ...users[id], ...patch };
  await writeUsers(users);
}

