// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";
import type { DeployShopResult } from "@platform-core/createShop";

export interface DeployInfo
  extends Partial<DeployShopResult> {
  domainStatus?: string;
  error?: string;
}

export interface DeployResult {
  ok: boolean;
  info?: DeployInfo | { status: "pending"; error?: string; domainStatus?: string };
  error?: string;
}

async function createCloudflareRecords(
  shopId: string,
  domain: string
): Promise<{ status?: string; cnameTarget?: string }> {
  const account = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;
  if (!account || !token) throw new Error("Cloudflare credentials not configured");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: domain }),
    }
  );

  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? "Failed to provision domain");
  }
  return {
    status: json.result?.status as string | undefined,
    cnameTarget: json.result?.verification_data?.cname_target as string | undefined,
  };
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
    return { ok: false, error: json.error ?? "Deployment failed" };
  }

  let info: DeployInfo = json as DeployInfo;

  if (domain) {
    try {
      const cf = await createCloudflareRecords(shopId, domain);
      info = {
        ...(json as DeployInfo),
        domainStatus: cf.status ?? (json as DeployInfo).domainStatus,
        instructions:
          cf.cnameTarget
            ? `Add a CNAME record for ${domain} pointing to ${cf.cnameTarget}`
            : (json as DeployInfo).instructions,
      };

      await fetch("/cms/api/deploy-shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shopId, ...info }),
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
): Promise<DeployInfo | { status: "pending"; error?: string; domainStatus?: string }> {
  const res = await fetch(`/cms/api/deploy-shop?id=${shopId}`);
  return (await res.json()) as DeployInfo | { status: "pending"; error?: string; domainStatus?: string };
}

