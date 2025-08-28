// apps/cms/src/actions/cloudflare.server.ts
"use server";

import { env } from "@acme/config";
import { ensureAuthorized } from "./common/auth";

interface CloudflareAPIResponse<T> {
  result?: T;
  errors?: { message?: string }[];
}

type AddDomainResult = {
  verification_data?: { cname_target?: string };
};

type ZoneResult = { id: string }[];

type VerifyResult = {
  status?: string;
  certificate_status?: string;
};

export async function provisionDomain(
  shopId: string,
  domain: string
): Promise<{ status?: string; certificateStatus?: string }> {
  await ensureAuthorized();
  const account = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) throw new Error("Cloudflare credentials not configured");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } as const;

  const addRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: domain }),
    }
  );
  const addJson: CloudflareAPIResponse<AddDomainResult> = await addRes.json();
  if (!addRes.ok) {
    throw new Error(addJson.errors?.[0]?.message ?? "Failed to provision domain");
  }

  const cnameTarget =
    addJson.result?.verification_data?.cname_target || `${shopId}.pages.dev`;

  const root = domain.split(".").slice(-2).join(".");
  const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${root}`, {
    headers,
  });
  const zoneJson: CloudflareAPIResponse<ZoneResult> = await zoneRes.json();
  const zoneId = zoneJson.result?.[0]?.id;
  if (zoneId) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "CNAME",
        name: domain,
        content: cnameTarget,
        ttl: 1,
      }),
    }).catch(() => {});
  }

  const verifyRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains/${domain}/verify`,
    { method: "POST", headers }
  );
  const verifyJson: CloudflareAPIResponse<VerifyResult> = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(
      verifyJson.errors?.[0]?.message ?? "Failed to issue certificate"
    );
  }

  return {
    status: verifyJson.result?.status,
    certificateStatus: verifyJson.result?.certificate_status,
  };
}
