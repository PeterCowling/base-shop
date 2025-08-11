import { promises as fs } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
}

const STORE_PATH = path.join(process.cwd(), 'data', 'users.json');

async function readStore(): Promise<Record<string, User>> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, User>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, User>): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function addUser({
  id,
  email,
  passwordHash,
  role = 'customer',
}: {
  id: string;
  email: string;
  passwordHash: string;
  role?: string;
}): Promise<void> {
  const store = await readStore();
  store[id] = { id, email, passwordHash, role };
  await writeStore(store);
}

export async function getUserById(id: string): Promise<User | null> {
  const store = await readStore();
  return store[id] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const store = await readStore();
  return (
    Object.values(store).find((u) => u.email === email) ?? null
  );
}

export async function verifyUserPassword(
  id: string,
  password: string,
): Promise<boolean> {
  const user = await getUserById(id);
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function deleteUser(id: string): Promise<void> {
  const store = await readStore();
  delete store[id];
  await writeStore(store);
}
