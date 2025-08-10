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

async function createCloudflareRecords(
  shopId: string,
  domain: string
): Promise<{ status?: string; certificateStatus?: string }> {
  const account = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;
  if (!account || !token) throw new Error("Cloudflare credentials not configured");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } as const;

  // Add custom domain to project
  const addRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: domain }),
    }
  );
  const addJson = (await addRes.json()) as any;
  if (!addRes.ok) {
    throw new Error(addJson.errors?.[0]?.message ?? "Failed to provision domain");
  }

  const cnameTarget =
    addJson.result?.verification_data?.cname_target || `${shopId}.pages.dev`;

  // Determine zone for domain and create DNS record
  const root = domain.split(".").slice(-2).join(".");
  const zoneRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${root}`,
    { headers }
  );
  const zoneJson = (await zoneRes.json()) as any;
  const zoneId = zoneJson.result?.[0]?.id as string | undefined;
  if (zoneId) {
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "CNAME",
          name: domain,
          content: cnameTarget,
          ttl: 1,
        }),
      }
    ).catch(() => {});
  }

  // Verify domain / issue certificate
  const verifyRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains/${domain}/verify`,
    { method: "POST", headers }
  );
  const verifyJson = (await verifyRes.json()) as any;
  if (!verifyRes.ok) {
    throw new Error(
      verifyJson.errors?.[0]?.message ?? "Failed to issue certificate"
    );
  }

  return {
    status: verifyJson.result?.status as string | undefined,
    certificateStatus: verifyJson.result?.certificate_status as string | undefined,
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
        certificateStatus: cf.certificateStatus,
      };

      await fetch("/cms/api/deploy-shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shopId,
          domain,
          domainStatus: cf.status,
          certificateStatus: cf.certificateStatus,
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

