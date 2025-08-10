// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";
import type { DeployStatusBase } from "@platform-core/createShop";

export interface DeployResult {
  ok: boolean;
  info?: DeployStatusBase;
  error?: string;
}

export async function deployShop(
  shopId: string,
  domain: string
): Promise<DeployResult> {
  try {
    validateShopName(shopId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const res = await fetch("/cms/api/deploy-shop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(domain ? { id: shopId, domain } : { id: shopId }),
  });

  const json = (await res.json()) as DeployStatusBase;

  if (res.ok) return { ok: true, info: json };

  return { ok: false, error: json.error ?? "Deployment failed" };
}

