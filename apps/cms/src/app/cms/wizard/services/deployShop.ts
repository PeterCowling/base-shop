// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";
import type { DeployShopResult } from "@platform-core/createShop";
import type { ShopDomainDetails } from "@platform-core/src/shops";

export interface DeployResult {
  ok: boolean;
  info?: DeployShopResult | { status: "pending"; error?: string };
  domain?: ShopDomainDetails;
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
    body: JSON.stringify({ id: shopId, domain }),
  });

  const json = (await res.json()) as
    | (DeployShopResult & { domain?: ShopDomainDetails })
    | { status: "pending"; error?: string };

  if (res.ok) {
    return { ok: true, info: json, domain: (json as any).domain };
  }

  return { ok: false, error: (json as any).error ?? "Deployment failed" };
}

