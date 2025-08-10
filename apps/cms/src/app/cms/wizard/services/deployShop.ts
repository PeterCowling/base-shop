// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";
import type { DeployShopResult } from "@platform-core/createShop";

export interface DeployInfo
  extends Partial<DeployShopResult> {
  domainStatus?: string;
  certificateStatus?: string;
  error?: string;
}

export interface DeployResult {
  ok: boolean;
  info?:
    | DeployInfo
    | { status: "pending"; error?: string; domainStatus?: string; certificateStatus?: string };
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

  const json = (await res.json()) as DeployInfo | { status: "pending"; error?: string };

  if (!res.ok) {
    return { ok: false, error: (json as any).error ?? "Deployment failed" };
  }

  let info: DeployInfo = json as DeployInfo;

  if (domain) {
    try {
      const cfRes = await fetch("/cms/api/cloudflare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shopId, domain }),
      });
      const cfJson = (await cfRes.json()) as {
        status?: string;
        certificateStatus?: string;
        error?: string;
      };
      if (!cfRes.ok) {
        throw new Error(cfJson.error ?? "Failed to provision domain");
      }
      info = {
        ...(json as DeployInfo),
        domainStatus: cfJson.status ?? (json as DeployInfo).domainStatus,
        certificateStatus: cfJson.certificateStatus,
      };

      await fetch("/cms/api/deploy-shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shopId,
          domain,
          domainStatus: cfJson.status,
          certificateStatus: cfJson.certificateStatus,
        }),
      });
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { ok: true, info };
}

export async function getDeployStatus(
  shopId: string
): Promise<
  | DeployInfo
  | { status: "pending"; error?: string; domainStatus?: string; certificateStatus?: string }
> {
  const res = await fetch(`/cms/api/deploy-shop?id=${shopId}`);
  return (await res.json()) as
    | DeployInfo
    | { status: "pending"; error?: string; domainStatus?: string; certificateStatus?: string };
}
