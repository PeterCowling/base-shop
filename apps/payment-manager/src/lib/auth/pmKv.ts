import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Minimal KV namespace interface — subset of the Cloudflare KVNamespace API
 * used by session revocation.
 */
export interface PmKvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

// Extend the CloudflareEnv global interface to include our KV binding.
declare global {
  interface CloudflareEnv {
    PAYMENT_MANAGER_KV?: PmKvNamespace;
  }
}

/**
 * Get the PAYMENT_MANAGER_KV namespace from the Cloudflare context.
 *
 * Returns null in local dev or if the binding is missing.
 * Uses the async form of getCloudflareContext — required for nodejs runtime routes.
 */
export async function getPmKv(): Promise<PmKvNamespace | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.PAYMENT_MANAGER_KV ?? null;
  } catch {
    return null;
  }
}
