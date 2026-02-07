import type { InventoryHoldDb } from "./inventoryHolds.db";
import type {
  InventoryValidationFailure,
  InventoryValidationRequest,
} from "./inventoryValidation";
import { variantKey } from "./types/inventory";

export function normalizeHoldRequests(
  requests: InventoryValidationRequest[],
): InventoryValidationFailure[] {
  const byKey = new Map<string, InventoryValidationFailure>();
  for (const item of requests) {
    const attrs = item.variantAttributes ?? {};
    const key = variantKey(item.sku, attrs);
    const existing = byKey.get(key);
    if (existing) {
      existing.requested += item.quantity;
    } else {
      byKey.set(key, {
        sku: item.sku,
        variantAttributes: attrs,
        variantKey: key,
        requested: item.quantity,
        available: 0,
      });
    }
  }
  return Array.from(byKey.values());
}

export function getInventoryRetryAfterMs(): number {
  const raw = process.env.INVENTORY_RETRY_AFTER_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return 750;
}

export function getInventoryLockTimeoutMs(): number {
  const raw = process.env.INVENTORY_LOCK_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return 250;
}

export function isInventoryBusyError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: unknown; message?: unknown };
  const code = typeof anyErr.code === "string" ? anyErr.code : "";
  if (code === "55P03" || code === "40P01" || code === "40001" || code === "57014") return true;
  const msg = typeof anyErr.message === "string" ? anyErr.message : "";
  return /lock timeout|deadlock detected|could not serialize access|statement timeout/i.test(msg);
}

export async function setLocalLockTimeout(tx: InventoryHoldDb, ms: number): Promise<void> {
  const lockTimeoutMs = Math.max(1, Math.floor(ms));
  if (typeof tx.$executeRawUnsafe !== "function") return;
  await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${lockTimeoutMs}ms'`);
}

