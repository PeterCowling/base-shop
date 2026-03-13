import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Minimal KV namespace interface — subset of the Cloudflare KVNamespace API
 * used by session revocation.
 */
export interface InventoryKvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

// Extend the CloudflareEnv global interface to include our KV binding.
declare global {
  interface CloudflareEnv {
    INVENTORY_KV?: InventoryKvNamespace;
  }
}

/**
 * Get the INVENTORY_KV namespace from the Cloudflare context.
 *
 * Returns null in local dev or if the binding is missing.
 * Uses the async form of getCloudflareContext — required for nodejs runtime routes.
 */
export async function getInventoryKv(): Promise<InventoryKvNamespace | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.INVENTORY_KV ?? null;
  } catch {
    return null;
  }
}
