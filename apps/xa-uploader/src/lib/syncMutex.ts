import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Minimal KV namespace interface — subset of the Cloudflare KVNamespace API
 * used by the sync mutex. Avoids a direct devDependency on @cloudflare/workers-types.
 */
export interface UploaderKvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Minimal R2 bucket interface — subset of the Cloudflare R2Bucket API
 * used by the image upload route. Avoids a direct devDependency on @cloudflare/workers-types.
 */
export interface UploaderR2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: { httpMetadata?: { contentType?: string } }): Promise<{ key: string } | null>;
  get(key: string): Promise<{ body: ReadableStream; key: string } | null>;
  head(key: string): Promise<{ key: string } | null>;
  delete(key: string): Promise<void>;
}

// Extend the CloudflareEnv global interface to include our KV and R2 bindings.
declare global {
  interface CloudflareEnv {
    XA_UPLOADER_KV?: UploaderKvNamespace;
    XA_MEDIA_BUCKET?: UploaderR2Bucket;
  }
}

const MUTEX_TTL_SECONDS = 300; // 5 minutes — matches max sync route timeout

function syncLockKey(storefrontId: string): string {
  return `xa-sync-lock:${storefrontId}`;
}

/**
 * Get the KV namespace from the Cloudflare context.
 *
 * Returns null in local FS mode (KV unavailable) or if the binding is missing.
 * Uses the async form of getCloudflareContext — required for nodejs runtime routes.
 */
export async function getUploaderKv(): Promise<UploaderKvNamespace | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.XA_UPLOADER_KV ?? null;
  } catch {
    return null;
  }
}

/**
 * Attempt to acquire the sync mutex for the given storefront.
 *
 * Best-effort probabilistic guard — not a hard serialization guarantee.
 * Cloudflare KV does not provide atomic compare-and-set; a narrow race window
 * exists between the get and put steps.
 *
 * Returns true if the lock was acquired (caller may proceed).
 * Returns false if the lock key is already present (another sync is likely running).
 * Returns true (fail-open) if KV is unavailable — KV outage must not block all syncs.
 */
export async function acquireSyncMutex(kv: UploaderKvNamespace, storefrontId: string): Promise<boolean> {
  const key = syncLockKey(storefrontId);
  const existing = await kv.get(key);
  if (existing !== null) {
    // Lock key is present — another sync is running (per current KV state).
    return false;
  }
  // Non-atomic: set the lock key with TTL. A parallel request could also pass the
  // get check above and both set the key — this is an acknowledged race window.
  await kv.put(key, "1", { expirationTtl: MUTEX_TTL_SECONDS });
  return true;
}

/**
 * Release the sync mutex for the given storefront.
 */
export async function releaseSyncMutex(kv: UploaderKvNamespace, storefrontId: string): Promise<void> {
  const key = syncLockKey(storefrontId);
  await kv.delete(key);
}
