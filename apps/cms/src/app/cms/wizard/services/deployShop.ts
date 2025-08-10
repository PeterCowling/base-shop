// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";
import type { DeployShopResult } from "@platform-core/createShop";

export interface DeployResult {
  ok: boolean;
  info?: DeployShopResult | { status: "pending"; error?: string };
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
    | DeployShopResult
    | { status: "pending"; error?: string };

  if (res.ok) return { ok: true, info: json };

  return { ok: false, error: json.error ?? "Deployment failed" };
}

export async function getDeployStatus(
  shopId: string
): Promise<DeployShopResult | { status: "pending"; error?: string }> {
  const res = await fetch(`/cms/api/deploy-shop?id=${shopId}`);
  if (!res.ok) {
    return {
      status: "pending",
      error: `Status request failed: ${res.status}`,
    };
  }
  return (await res.json()) as DeployShopResult | {
    status: "pending";
    error?: string;
  };
}

