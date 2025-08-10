// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@platform-core/src/shops";
import type { DeployShopResult } from "@platform-core/createShop";

export interface DeployResult {
  ok: boolean;
  info?:
    | (DeployShopResult & { dnsRecordId?: string; certificateId?: string })
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
    | (DeployShopResult & { dnsRecordId?: string; certificateId?: string })
    | { status: "pending"; error?: string };

  if (res.ok) {
    if (
      domain &&
      process.env.NEXT_PUBLIC_CLOUDFLARE_ZONE_ID &&
      process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN
    ) {
      const base = "https://api.cloudflare.com/client/v4";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN}`,
      };
      try {
        await fetch(
          `${base}/zones/${process.env.NEXT_PUBLIC_CLOUDFLARE_ZONE_ID}/dns_records`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              type: "CNAME",
              name: domain,
              content: `${shopId}.pages.dev`,
              ttl: 1,
              proxied: true,
            }),
          }
        );
        await fetch(
          `${base}/zones/${process.env.NEXT_PUBLIC_CLOUDFLARE_ZONE_ID}/custom_hostnames`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              hostname: domain,
              ssl: { method: "txt", type: "dv", wildcard: false },
            }),
          }
        );
      } catch {
        // ignore Cloudflare errors on client
      }
    }
    return { ok: true, info: json };
  }

  return { ok: false, error: json.error ?? "Deployment failed" };
}

