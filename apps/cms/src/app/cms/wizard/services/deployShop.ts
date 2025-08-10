// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";
import type { DeployShopResult } from "@platform-core/createShop";

export interface DeployResult {
  ok: boolean;
  info?:
    | (DeployShopResult & {
        domain?: string;
        domainStatus?: "pending" | "active" | "error";
      })
    | { status: "pending"; error?: string };
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

  if (res.ok) {
    if (domain) {
      try {
        await provisionDns(shopId, domain);
        (json as any).domain = domain;
        (json as any).domainStatus = "pending";
      } catch (err) {
        console.error("Provisioning DNS failed", err);
        (json as any).domainStatus = "error";
      }
    }
    return { ok: true, info: json };
  }

  return { ok: false, error: json.error ?? "Deployment failed" };
}

async function provisionDns(id: string, domain: string): Promise<void> {
  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;
  const zone = process.env.NEXT_PUBLIC_CLOUDFLARE_ZONE_ID;
  const account = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  if (!token || !zone || !account) return;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } as const;

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${id}/domains`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: domain }),
    }
  );

  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "CNAME",
      name: domain,
      content: `${id}.pages.dev`,
      ttl: 1,
      proxied: true,
    }),
  });
}

