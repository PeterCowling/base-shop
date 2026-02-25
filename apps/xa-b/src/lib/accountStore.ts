import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type StoreMode = "file" | "memory";

type AccountPreferredChannel = "whatsapp" | "email" | "wechat";

type AccountUser = {
  id: string;
  email: string;
  passwordHash: string;
  whatsapp?: string;
  skype?: string;
  preferredChannel: AccountPreferredChannel;
  createdAt: string;
  lastLoginAt?: string;
};

type AccountOrderLine = {
  skuId: string;
  title: string;
  size?: string;
  qty: number;
  unitPrice: number;
};

type AccountOrder = {
  id: string;
  number: string;
  userId: string;
  email: string;
  currency: string;
  status: "Processing" | "Shipped";
  createdAt: string;
  lines: AccountOrderLine[];
};

type AccountStore = {
  users: AccountUser[];
  orders: AccountOrder[];
};

declare global {
  var __xaAccountStore: AccountStore | undefined;
  var __xaAccountStoreMode: StoreMode | undefined;
}

const PASSWORD_SCHEME = "scrypt-v1";
const PASSWORD_MIN_LENGTH = 8;
const STORE_PATH =
  process.env.XA_ACCOUNT_STORE_PATH ?? path.join("data", "xa-b", "account-store.json");

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function cloneDefaultStore(): AccountStore {
  return { users: [], orders: [] };
}

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizePreferredChannel(value: unknown): AccountPreferredChannel {
  if (value === "email" || value === "wechat") return value;
  return "whatsapp";
}

function normalizeOrderLines(lines: unknown): AccountOrderLine[] {
  if (!Array.isArray(lines)) return [];
  const out: AccountOrderLine[] = [];

  for (const candidate of lines) {
    if (!candidate || typeof candidate !== "object") continue;
    const skuId = normalizeString((candidate as { skuId?: unknown }).skuId, 120);
    const title = normalizeString((candidate as { title?: unknown }).title, 240);
    const sizeRaw = (candidate as { size?: unknown }).size;
    const size = typeof sizeRaw === "string" ? normalizeString(sizeRaw, 40) : undefined;
    const qtyRaw = (candidate as { qty?: unknown }).qty;
    const unitPriceRaw = (candidate as { unitPrice?: unknown }).unitPrice;
    const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
    const unitPrice =
      typeof unitPriceRaw === "number" ? unitPriceRaw : Number(unitPriceRaw);

    if (!skuId || !title) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;

    out.push({
      skuId,
      title,
      size: size || undefined,
      qty: Math.floor(qty),
      unitPrice,
    });
  }

  return out;
}

function normalizeAccountStoreShape(data: Partial<AccountStore> | null): AccountStore {
  const users = Array.isArray(data?.users) ? data.users : [];
  const orders = Array.isArray(data?.orders) ? data.orders : [];

  const normalizedUsers: AccountUser[] = [];
  for (const candidate of users) {
    if (!candidate || typeof candidate !== "object") continue;
    const id = normalizeString((candidate as { id?: unknown }).id, 80);
    const email = normalizeAccountEmail(
      normalizeString((candidate as { email?: unknown }).email, 320),
    );
    const passwordHash = normalizeString(
      (candidate as { passwordHash?: unknown }).passwordHash,
      512,
    );
    const preferredChannel = normalizePreferredChannel(
      (candidate as { preferredChannel?: unknown }).preferredChannel,
    );
    const createdAt = normalizeString((candidate as { createdAt?: unknown }).createdAt, 80);
    const lastLoginAt = normalizeString(
      (candidate as { lastLoginAt?: unknown }).lastLoginAt,
      80,
    );
    const whatsapp = normalizeString((candidate as { whatsapp?: unknown }).whatsapp, 80);
    const skype = normalizeString((candidate as { skype?: unknown }).skype, 80);

    if (!id || !email || !passwordHash || !createdAt) continue;
    normalizedUsers.push({
      id,
      email,
      passwordHash,
      preferredChannel,
      createdAt,
      lastLoginAt: lastLoginAt || undefined,
      whatsapp: whatsapp || undefined,
      skype: skype || undefined,
    });
  }

  const normalizedOrders: AccountOrder[] = [];
  for (const candidate of orders) {
    if (!candidate || typeof candidate !== "object") continue;
    const id = normalizeString((candidate as { id?: unknown }).id, 80);
    const number = normalizeString((candidate as { number?: unknown }).number, 20);
    const userId = normalizeString((candidate as { userId?: unknown }).userId, 80);
    const email = normalizeAccountEmail(
      normalizeString((candidate as { email?: unknown }).email, 320),
    );
    const currency = normalizeString((candidate as { currency?: unknown }).currency, 12);
    const statusRaw = normalizeString((candidate as { status?: unknown }).status, 20);
    const status = statusRaw === "Shipped" ? "Shipped" : "Processing";
    const createdAt = normalizeString((candidate as { createdAt?: unknown }).createdAt, 80);
    const lines = normalizeOrderLines((candidate as { lines?: unknown }).lines);

    if (!id || !number || !userId || !email || !currency || !createdAt || !lines.length) {
      continue;
    }

    normalizedOrders.push({
      id,
      number,
      userId,
      email,
      currency,
      status,
      createdAt,
      lines,
    });
  }

  return {
    users: normalizedUsers,
    orders: normalizedOrders,
  };
}

async function readStoreFile(): Promise<AccountStore | null> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return normalizeAccountStoreShape(JSON.parse(raw) as Partial<AccountStore>);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") return cloneDefaultStore();
    return null;
  }
}

async function writeStoreFile(store: AccountStore): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    const tmpPath = `${STORE_PATH}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(store, null, 2), "utf-8");
    await fs.rename(tmpPath, STORE_PATH);
    return true;
  } catch {
    return false;
  }
}

function getMemoryStore(): AccountStore {
  if (!globalThis.__xaAccountStore) {
    globalThis.__xaAccountStore = cloneDefaultStore();
  }
  return globalThis.__xaAccountStore;
}

async function loadStore(): Promise<{ store: AccountStore; mode: StoreMode }> {
  const fromFile = await readStoreFile();
  if (fromFile) {
    globalThis.__xaAccountStoreMode = "file";
    return { store: fromFile, mode: "file" };
  }

  if (isProduction()) {
    throw new Error("Account store unavailable: file persistence required.");
  }

  const store = getMemoryStore();
  globalThis.__xaAccountStoreMode = "memory";
  return { store, mode: "memory" };
}

async function saveStore(store: AccountStore, mode: StoreMode) {
  if (mode === "file") {
    const wrote = await writeStoreFile(store);
    if (wrote) {
      globalThis.__xaAccountStoreMode = "file";
      return { store, mode: "file" as const };
    }
    if (isProduction()) {
      throw new Error("Account store unavailable: write failed.");
    }
  }

  if (isProduction()) {
    throw new Error("Account store unavailable: memory fallback disabled.");
  }

  globalThis.__xaAccountStore = store;
  globalThis.__xaAccountStoreMode = "memory";
  return { store, mode: "memory" as const };
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${PASSWORD_SCHEME}$${salt}$${hash}`;
}

function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, hash] = encoded.split("$");
  if (scheme !== PASSWORD_SCHEME || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(crypto.scryptSync(password, salt, expected.length));
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function generateOrderNumber(existingNumbers: Set<string>) {
  for (let i = 0; i < 30; i += 1) {
    const candidate = `${Math.floor(1000000 + Math.random() * 9000000)}`;
    if (!existingNumbers.has(candidate)) return candidate;
  }
  return `${Date.now()}`;
}

function normalizeOrderNumber(value: string) {
  return value.trim();
}

export function normalizeAccountEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidAccountEmail(value: string) {
  const email = normalizeAccountEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongAccountPassword(value: string) {
  return value.trim().length >= PASSWORD_MIN_LENGTH;
}

export function accountOrderTotal(order: Pick<AccountOrder, "lines">) {
  return order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

export async function createAccountUser(input: {
  email: string;
  password: string;
  whatsapp?: string;
  skype?: string;
  preferredChannel?: AccountPreferredChannel;
}) {
  const { store, mode } = await loadStore();
  const email = normalizeAccountEmail(input.email);
  const existing = store.users.find((candidate) => candidate.email === email);
  if (existing) {
    return { user: null, reason: "exists" as const, storeMode: mode };
  }

  const user: AccountUser = {
    id: createId("usr"),
    email,
    passwordHash: hashPassword(input.password),
    whatsapp: normalizeString(input.whatsapp, 80) || undefined,
    skype: normalizeString(input.skype, 80) || undefined,
    preferredChannel: normalizePreferredChannel(input.preferredChannel),
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  const saved = await saveStore(store, mode);
  return { user, storeMode: saved.mode };
}

export async function authenticateAccountUser(input: {
  email: string;
  password: string;
}) {
  const { store, mode } = await loadStore();
  const email = normalizeAccountEmail(input.email);
  const user = store.users.find((candidate) => candidate.email === email);

  if (!user) {
    return { user: null, storeMode: mode };
  }

  const validPassword = verifyPassword(input.password, user.passwordHash);
  if (!validPassword) {
    return { user: null, storeMode: mode };
  }

  user.lastLoginAt = new Date().toISOString();
  await saveStore(store, mode);
  return { user, storeMode: mode };
}

export async function getAccountUserById(userId: string) {
  const { store, mode } = await loadStore();
  const user = store.users.find((candidate) => candidate.id === userId) ?? null;
  return { user, storeMode: mode };
}

export async function listOrdersForAccountUser(userId: string) {
  const { store, mode } = await loadStore();
  const orders = store.orders
    .filter((candidate) => candidate.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return { orders, storeMode: mode };
}

export async function findOrderForAccountUser(userId: string, orderNumber: string) {
  const { store, mode } = await loadStore();
  const normalizedOrder = normalizeOrderNumber(orderNumber);
  const order =
    store.orders.find(
      (candidate) =>
        candidate.userId === userId && candidate.number === normalizedOrder,
    ) ?? null;
  return { order, storeMode: mode };
}

export async function findOrdersForTracking(orderNumber: string, email: string) {
  const { store, mode } = await loadStore();
  const normalizedOrder = normalizeOrderNumber(orderNumber);
  const normalizedEmail = normalizeAccountEmail(email);
  const orders = store.orders
    .filter(
      (candidate) =>
        candidate.number === normalizedOrder &&
        normalizeAccountEmail(candidate.email) === normalizedEmail,
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return { orders, storeMode: mode };
}

export async function createOrderForAccount(input: {
  userId: string;
  email: string;
  currency: string;
  lines: AccountOrderLine[];
}) {
  const { store, mode } = await loadStore();
  const existingNumbers = new Set(store.orders.map((order) => order.number));
  const order: AccountOrder = {
    id: createId("ord"),
    number: generateOrderNumber(existingNumbers),
    userId: input.userId,
    email: normalizeAccountEmail(input.email),
    currency: normalizeString(input.currency, 12) || "USD",
    status: "Processing",
    createdAt: new Date().toISOString(),
    lines: input.lines,
  };

  store.orders.unshift(order);
  const saved = await saveStore(store, mode);
  return { order, storeMode: saved.mode };
}

export type {
  AccountOrder,
  AccountOrderLine,
  AccountPreferredChannel,
  AccountUser,
  StoreMode,
};
