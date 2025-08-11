import { promises as fs } from "fs";
import path from "path";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  resetTokenHash: string | null;
  resetTokenExpires: number | null;
}

const DATA_PATH = path.join(process.cwd(), "data", "users.json");

async function readStore(): Promise<Record<string, User>> {
  try {
    const data = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

async function writeStore(store: Record<string, User>): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2));
}

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
}): Promise<User> {
  const store = await readStore();
  const user: User = {
    id,
    email,
    passwordHash,
    role,
    resetTokenHash: null,
    resetTokenExpires: null,
  };
  store[id] = user;
  await writeStore(store);
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const store = await readStore();
  return store[id] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const store = await readStore();
  return Object.values(store).find((u) => u.email === email) ?? null;
}

export async function setResetToken(
  id: string,
  tokenHash: string | null,
  expires: number | null,
): Promise<void> {
  const store = await readStore();
  const user = store[id];
  if (user) {
    user.resetTokenHash = tokenHash;
    user.resetTokenExpires = expires;
    await writeStore(store);
  }
}

export async function getUserByResetToken(
  tokenHash: string,
): Promise<User | null> {
  const store = await readStore();
  const now = Date.now();
  return (
    Object.values(store).find(
      (u) =>
        u.resetTokenHash === tokenHash &&
        u.resetTokenExpires !== null &&
        u.resetTokenExpires > now,
    ) ?? null
  );
}

export async function updatePassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  const store = await readStore();
  const user = store[id];
  if (user) {
    user.passwordHash = passwordHash;
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await writeStore(store);
  }
}
