import type { Environment } from "@acme/types";
import { readDeployInfo } from "./deployInfo";

export function getShopBaseUrl(params: {
  shopId: string;
  env?: Environment;
}): URL | null {
  const info = readDeployInfo(params.shopId);
  if (!info) return null;

  // Prefer an explicit runtime URL when present, then previewUrl.
  const raw = info.url ?? info.previewUrl;
  if (!raw) return null;

  try {
    return new URL(raw);
  } catch {
    return null;
  }
}
