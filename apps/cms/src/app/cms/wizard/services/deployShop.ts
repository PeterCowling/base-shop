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

  if (domain) {
    try {
      await createDnsRecord(domain, `${shopId}.pages.dev`);
      await issueCertificate(domain);
    } catch (err) {
      console.error("Cloudflare setup failed", err);
    }
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

async function createDnsRecord(domain: string, target: string): Promise<void> {
  const zone = process.env.NEXT_PUBLIC_CF_ZONE_ID;
  const token = process.env.NEXT_PUBLIC_CF_API_TOKEN;
  if (!zone || !token) return;
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type: "CNAME", name: domain, content: target }),
  });
}

async function issueCertificate(domain: string): Promise<void> {
  const zone = process.env.NEXT_PUBLIC_CF_ZONE_ID;
  const token = process.env.NEXT_PUBLIC_CF_API_TOKEN;
  if (!zone || !token) return;
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/custom_hostnames`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ hostname: domain }),
  });
}

