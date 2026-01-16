/* eslint-disable security/detect-non-literal-fs-filename -- XA-0001 [ttl=2026-12-31] filesystem-backed access store pending security/i18n overhaul */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { normalizeInviteCode, resolveInviteHashSecret } from "./stealth";

type InviteRecord = {
  id: string;
  hash: string;
  codeHint: string;
  label?: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  revokedAt?: string;
  lastUsedAt?: string;
  requestId?: string;
};

type AccessRequest = {
  id: string;
  handle: string;
  referredBy: string;
  note: string;
  createdAt: string;
  userAgent: string;
  requestIp: string;
  status: "pending" | "approved" | "dismissed";
  inviteId?: string;
  approvedAt?: string;
  dismissedAt?: string;
};

type AccessStore = {
  invites: InviteRecord[];
  requests: AccessRequest[];
};

type StoreMode = "file" | "memory";

declare global {
  var __xaAccessStore: AccessStore | undefined;
  var __xaAccessStoreMode: StoreMode | undefined;
}

const DEFAULT_STORE: AccessStore = { invites: [], requests: [] };
const REQUEST_LIMIT = 500;
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_LENGTH = 8;

function resolveStorePath() {
  return (
    process.env.XA_ACCESS_STORE_PATH ??
    path.resolve(process.cwd(), "data/access/access-store.json")
  );
}

function ensureStoreShape(data: Partial<AccessStore> | null): AccessStore {
  return {
    invites: Array.isArray(data?.invites) ? data?.invites ?? [] : [],
    requests: Array.isArray(data?.requests) ? data?.requests ?? [] : [],
  };
}

function getMemoryStore(): AccessStore {
  if (!globalThis.__xaAccessStore) {
    globalThis.__xaAccessStore = { ...DEFAULT_STORE };
  }
  return globalThis.__xaAccessStore;
}

async function readStoreFile(): Promise<AccessStore | null> {
  try {
    const data = await fs.readFile(resolveStorePath(), "utf-8");
    return ensureStoreShape(JSON.parse(data) as Partial<AccessStore>);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") return { ...DEFAULT_STORE };
    return null;
  }
}

async function writeStoreFile(store: AccessStore): Promise<boolean> {
  try {
    const storePath = resolveStorePath();
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    const payload = JSON.stringify(store, null, 2);
    const tempPath = `${storePath}.tmp`;
    await fs.writeFile(tempPath, payload, "utf-8");
    await fs.rename(tempPath, storePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadAccessStore(): Promise<{ store: AccessStore; mode: StoreMode }> {
  const storeFromFile = await readStoreFile();
  if (storeFromFile) {
    globalThis.__xaAccessStoreMode = "file";
    return { store: storeFromFile, mode: "file" };
  }
  const store = getMemoryStore();
  globalThis.__xaAccessStoreMode = "memory";
  return { store, mode: "memory" };
}

export async function saveAccessStore(store: AccessStore, mode: StoreMode) {
  if (mode === "file") {
    const wrote = await writeStoreFile(store);
    if (wrote) {
      globalThis.__xaAccessStoreMode = "file";
      return { store, mode: "file" as const };
    }
  }
  globalThis.__xaAccessStore = store;
  globalThis.__xaAccessStoreMode = "memory";
  return { store, mode: "memory" as const };
}

function generateId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

export function generateInviteCode() {
  const bytes = crypto.randomBytes(INVITE_LENGTH);
  let code = "";
  for (const byte of bytes) {
    code += INVITE_ALPHABET[byte % INVITE_ALPHABET.length] ?? "X";
  }
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export function hashInviteCode(code: string) {
  const secret = resolveInviteHashSecret();
  const normalized = normalizeInviteCode(code);
  if (!secret) {
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(normalized)
    .digest("hex");
}

function isInviteExpired(invite: InviteRecord) {
  if (!invite.expiresAt) return false;
  return Date.parse(invite.expiresAt) <= Date.now();
}

function hasInviteCapacity(invite: InviteRecord) {
  if (!invite.maxUses) return true;
  return invite.uses < invite.maxUses;
}

function pruneRequests(requests: AccessRequest[]) {
  if (requests.length <= REQUEST_LIMIT) return requests;
  return requests
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, REQUEST_LIMIT);
}

export async function createInvite({
  label,
  maxUses,
  expiresAt,
  requestId,
}: {
  label?: string;
  maxUses?: number;
  expiresAt?: string;
  requestId?: string;
}) {
  const code = generateInviteCode();
  const record: InviteRecord = {
    id: generateId("inv"),
    hash: hashInviteCode(code),
    codeHint: code.slice(-4).toUpperCase(),
    label,
    createdAt: new Date().toISOString(),
    expiresAt,
    maxUses,
    uses: 0,
    requestId,
  };

  const { store, mode } = await loadAccessStore();
  store.invites.push(record);
  const saved = await saveAccessStore(store, mode);
  return { code, invite: record, storeMode: saved.mode };
}

export async function revokeInvite(inviteId: string) {
  const { store, mode } = await loadAccessStore();
  const invite = store.invites.find((item) => item.id === inviteId);
  if (invite) {
    invite.revokedAt = new Date().toISOString();
  }
  const saved = await saveAccessStore(store, mode);
  return { invite, storeMode: saved.mode };
}

export async function registerInviteUse(inviteId: string) {
  const { store, mode } = await loadAccessStore();
  const invite = store.invites.find((item) => item.id === inviteId);
  if (invite) {
    invite.uses += 1;
    invite.lastUsedAt = new Date().toISOString();
  }
  const saved = await saveAccessStore(store, mode);
  return { invite, storeMode: saved.mode };
}

export async function listInvites() {
  const { store, mode } = await loadAccessStore();
  return { invites: store.invites, storeMode: mode };
}

export async function findValidInvite(code: string) {
  const hash = hashInviteCode(code);
  const { store, mode } = await loadAccessStore();
  const invite = store.invites.find((item) => item.hash === hash);
  if (!invite) return { invite: null, storeMode: mode };
  if (invite.revokedAt) return { invite: null, storeMode: mode };
  if (isInviteExpired(invite)) return { invite: null, storeMode: mode };
  if (!hasInviteCapacity(invite)) return { invite: null, storeMode: mode };
  return { invite, storeMode: mode };
}

export async function createAccessRequest(input: {
  handle: string;
  referredBy: string;
  note: string;
  userAgent: string;
  requestIp: string;
}) {
  const entry: AccessRequest = {
    id: generateId("req"),
    handle: input.handle,
    referredBy: input.referredBy,
    note: input.note,
    createdAt: new Date().toISOString(),
    userAgent: input.userAgent,
    requestIp: input.requestIp,
    status: "pending",
  };
  const { store, mode } = await loadAccessStore();
  store.requests.push(entry);
  store.requests = pruneRequests(store.requests);
  const saved = await saveAccessStore(store, mode);
  return { request: entry, storeMode: saved.mode };
}

export async function listAccessRequests() {
  const { store, mode } = await loadAccessStore();
  return { requests: store.requests, storeMode: mode };
}

export async function updateAccessRequest({
  requestId,
  status,
  inviteId,
}: {
  requestId: string;
  status: "approved" | "dismissed";
  inviteId?: string;
}) {
  const { store, mode } = await loadAccessStore();
  const request = store.requests.find((item) => item.id === requestId);
  if (request) {
    request.status = status;
    if (status === "approved") {
      request.inviteId = inviteId;
      request.approvedAt = new Date().toISOString();
    }
    if (status === "dismissed") {
      request.dismissedAt = new Date().toISOString();
    }
  }
  const saved = await saveAccessStore(store, mode);
  return { request, storeMode: saved.mode };
}

export function isInviteActive(invite: InviteRecord) {
  return !invite.revokedAt && !isInviteExpired(invite) && hasInviteCapacity(invite);
}

export type { AccessRequest, InviteRecord, StoreMode, AccessStore };
