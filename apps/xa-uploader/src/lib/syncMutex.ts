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
