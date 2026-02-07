// apps/cms/src/actions/cloudflare.server.ts
"use server";

import { coreEnv as env } from "@acme/config/env/core";

import { ensureAuthorized } from "./common/auth";

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

  type CloudflareError = { message?: string };
  type AddDomainResponse = {
    result?: { verification_data?: { cname_target?: string } };
    errors?: CloudflareError[];
  };
  const addRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: domain }),
    }
  );
  const addJson = (await addRes.json()) as AddDomainResponse;
  if (!addRes.ok) {
    throw new Error(addJson.errors?.[0]?.message ?? "Failed to provision domain");
  }

  const cnameTarget =
    addJson.result?.verification_data?.cname_target || `${shopId}.pages.dev`;

  const root = domain.split(".").slice(-2).join(".");
  type ZoneResponse = { result?: { id?: string }[] };
  const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${root}`, {
    headers,
  });
  const zoneJson = (await zoneRes.json()) as ZoneResponse;
  const zoneId = zoneJson.result?.[0]?.id as string | undefined;
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

  type VerifyResponse = {
    result?: { status?: string; certificate_status?: string };
    errors?: CloudflareError[];
  };
  const verifyRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains/${domain}/verify`,
    { method: "POST", headers }
  );
  const verifyJson = (await verifyRes.json()) as VerifyResponse;
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
