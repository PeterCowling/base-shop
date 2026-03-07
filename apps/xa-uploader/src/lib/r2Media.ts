import { getCloudflareContext } from "@opennextjs/cloudflare";

import { isLocalFsRuntimeEnabled } from "./localFsGuard";
import type { UploaderR2Bucket } from "./syncMutex";

/**
 * Get the R2 media bucket from the Cloudflare context.
 *
 * Returns null in local FS mode (R2 unavailable) or if the binding is missing.
 * Uses the async form of getCloudflareContext — required for nodejs runtime routes.
 */
export async function getMediaBucket(): Promise<UploaderR2Bucket | null> {
  if (isLocalFsRuntimeEnabled()) return null;
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.XA_MEDIA_BUCKET ?? null;
  } catch {
    return null;
  }
}
