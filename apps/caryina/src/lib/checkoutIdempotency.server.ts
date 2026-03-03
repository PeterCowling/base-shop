import "server-only";

import { createHash } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";

import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";

const STORE_FILENAME = "checkout-idempotency.json";

type CheckoutAttemptStatus = "in_progress" | "succeeded" | "failed" | "needs_review";

type ReplayBody = Record<string, unknown>;

export interface CheckoutAttemptRecord {
  idempotencyKey: string;
  requestHash: string;
  status: CheckoutAttemptStatus;
  createdAt: string;
  updatedAt: string;
  shopTransactionId?: string;
  holdId?: string;
  paymentAttemptedAt?: string;
  responseStatus?: number;
  responseBody?: ReplayBody;
  errorCode?: string;
  errorMessage?: string;
}

interface CheckoutAttemptStore {
  version: 1;
  records: CheckoutAttemptRecord[];
}

export type BeginCheckoutAttemptResult =
  | { kind: "acquired"; record: CheckoutAttemptRecord }
  | {
      kind: "replay";
      record: CheckoutAttemptRecord;
      responseStatus: number;
      responseBody: ReplayBody;
    }
  | { kind: "in_progress"; record: CheckoutAttemptRecord }
  | { kind: "conflict"; record: CheckoutAttemptRecord };

function checkoutStorePath(shopId: string): string {
  const safeShop = validateShopName(shopId);
  return path.join(resolveDataRoot(), safeShop, STORE_FILENAME);
}

async function ensureShopDir(shopId: string): Promise<void> {
  const safeShop = validateShopName(shopId);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 path uses validated shop id and trusted data root
  await fs.mkdir(path.join(resolveDataRoot(), safeShop), { recursive: true });
}

async function acquireLock(
  lockFile: string,
  { timeoutMs = 5000, staleMs = 60_000 }: { timeoutMs?: number; staleMs?: number } = {},
): Promise<fs.FileHandle> {
  const started = Date.now();
  while (true) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 lock path built from validated shop path
      return await fs.open(lockFile, "wx");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      if (Date.now() - started >= timeoutMs) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 lock path built from validated shop path
        const stat = await fs.stat(lockFile).catch(() => undefined);
        const stale =
          typeof stat?.mtimeMs === "number" && Date.now() - stat.mtimeMs > staleMs;
        if (stale) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 lock path built from validated shop path
          await fs.unlink(lockFile).catch(() => {});
          continue;
        }
        throw new Error(`Timed out acquiring checkout idempotency lock ${lockFile}`); // i18n-exempt -- developer error
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

function defaultStore(): CheckoutAttemptStore {
  return { version: 1, records: [] };
}

function sanitizeStore(input: unknown): CheckoutAttemptStore {
  const raw = input as Partial<CheckoutAttemptStore>;
  if (!raw || raw.version !== 1 || !Array.isArray(raw.records)) {
    return defaultStore();
  }
  const records = raw.records.filter((entry): entry is CheckoutAttemptRecord => {
    return Boolean(
      entry &&
        typeof entry.idempotencyKey === "string" &&
        typeof entry.requestHash === "string" &&
        typeof entry.status === "string" &&
        typeof entry.createdAt === "string" &&
        typeof entry.updatedAt === "string",
    );
  });
  return { version: 1, records };
}

async function readStore(shopId: string): Promise<CheckoutAttemptStore> {
  const filePath = checkoutStorePath(shopId);
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 store path built from validated shop path
    const raw = await fs.readFile(filePath, "utf8");
    return sanitizeStore(JSON.parse(raw) as unknown);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultStore();
    }
    throw err;
  }
}

async function writeStore(shopId: string, store: CheckoutAttemptStore): Promise<void> {
  const filePath = checkoutStorePath(shopId);
  const tmpPath = `${filePath}.${Date.now()}.tmp`;
  const payload = JSON.stringify(store, null, 2);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 temp file path built from validated shop path
  await fs.writeFile(tmpPath, payload, "utf8");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 store path built from validated shop path
  await fs.rename(tmpPath, filePath);
}

async function withStoreLock<T>(
  shopId: string,
  handler: (store: CheckoutAttemptStore) => Promise<{ result: T; changed: boolean }>,
): Promise<T> {
  await ensureShopDir(shopId);
  const filePath = checkoutStorePath(shopId);
  const lockFile = `${filePath}.lock`;
  const handle = await acquireLock(lockFile);
  try {
    const store = await readStore(shopId);
    const { result, changed } = await handler(store);
    if (changed) {
      await writeStore(shopId, store);
    }
    return result;
  } finally {
    await handle.close();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-CHECKOUT-01 lock path built from validated shop path
    await fs.unlink(lockFile).catch(() => {});
  }
}

function findRecord(
  store: CheckoutAttemptStore,
  idempotencyKey: string,
): CheckoutAttemptRecord | undefined {
  return store.records.find((record) => record.idempotencyKey === idempotencyKey);
}

export function buildCheckoutRequestHash(payload: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export async function beginCheckoutAttempt(params: {
  shopId: string;
  idempotencyKey: string;
  requestHash: string;
  now?: Date;
}): Promise<BeginCheckoutAttemptResult> {
  const nowIso = (params.now ?? new Date()).toISOString();
  return withStoreLock(params.shopId, async (store) => {
    const existing = findRecord(store, params.idempotencyKey);
    if (!existing) {
      const created: CheckoutAttemptRecord = {
        idempotencyKey: params.idempotencyKey,
        requestHash: params.requestHash,
        status: "in_progress",
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store.records.push(created);
      return { result: { kind: "acquired", record: created } as BeginCheckoutAttemptResult, changed: true };
    }

    if (existing.requestHash !== params.requestHash) {
      return {
        result: { kind: "conflict", record: existing } as BeginCheckoutAttemptResult,
        changed: false,
      };
    }

    if (existing.status === "in_progress") {
      return {
        result: { kind: "in_progress", record: existing } as BeginCheckoutAttemptResult,
        changed: false,
      };
    }

    return {
      result: {
        kind: "replay",
        record: existing,
        responseStatus: existing.responseStatus ?? 500,
        responseBody:
          existing.responseBody ??
          ({ error: "Stored checkout outcome unavailable" } as ReplayBody),
      } as BeginCheckoutAttemptResult,
      changed: false,
    };
  });
}

export async function markCheckoutAttemptReservation(params: {
  shopId: string;
  idempotencyKey: string;
  holdId: string;
  shopTransactionId: string;
  now?: Date;
}): Promise<void> {
  const nowIso = (params.now ?? new Date()).toISOString();
  await withStoreLock(params.shopId, async (store) => {
    const record = findRecord(store, params.idempotencyKey);
    if (!record) {
      return { result: undefined, changed: false };
    }
    record.holdId = params.holdId;
    record.shopTransactionId = params.shopTransactionId;
    record.updatedAt = nowIso;
    return { result: undefined, changed: true };
  });
}

export async function markCheckoutAttemptPaymentAttempted(params: {
  shopId: string;
  idempotencyKey: string;
  now?: Date;
}): Promise<void> {
  const nowIso = (params.now ?? new Date()).toISOString();
  await withStoreLock(params.shopId, async (store) => {
    const record = findRecord(store, params.idempotencyKey);
    if (!record) {
      return { result: undefined, changed: false };
    }
    record.paymentAttemptedAt = nowIso;
    record.updatedAt = nowIso;
    return { result: undefined, changed: true };
  });
}

export async function markCheckoutAttemptResult(params: {
  shopId: string;
  idempotencyKey: string;
  status: Exclude<CheckoutAttemptStatus, "in_progress">;
  responseStatus: number;
  responseBody: ReplayBody;
  errorCode?: string;
  errorMessage?: string;
  now?: Date;
}): Promise<void> {
  const nowIso = (params.now ?? new Date()).toISOString();
  await withStoreLock(params.shopId, async (store) => {
    const record = findRecord(store, params.idempotencyKey);
    if (!record) {
      return { result: undefined, changed: false };
    }
    record.status = params.status;
    record.responseStatus = params.responseStatus;
    record.responseBody = params.responseBody;
    record.errorCode = params.errorCode;
    record.errorMessage = params.errorMessage;
    record.updatedAt = nowIso;
    return { result: undefined, changed: true };
  });
}

export async function listStaleInProgressCheckoutAttempts(params: {
  shopId: string;
  staleBefore: Date;
}): Promise<CheckoutAttemptRecord[]> {
  const staleCutoff = params.staleBefore.toISOString();
  const store = await readStore(params.shopId);
  return store.records.filter(
    (record) => record.status === "in_progress" && record.updatedAt < staleCutoff,
  );
}
