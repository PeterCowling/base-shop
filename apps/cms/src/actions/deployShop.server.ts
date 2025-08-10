// apps/cms/src/actions/deployShop.server.ts
"use server";

import { authOptions } from "@cms/auth/options";
import { deployShop, type DeployShopResult } from "@platform-core/createShop";
import { setShopDomain, type ShopDomainDetails } from "@platform-core/src/shops";
import { getServerSession } from "next-auth";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user?.role ?? "")) {
    throw new Error("Forbidden");
  }
}

function resolveRepoRoot(): string {
  let dir = process.cwd();
  while (true) {
    if (fsSync.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export async function deployShopHosting(
  id: string,
  domain?: string,
): Promise<DeployShopResult & { domain?: ShopDomainDetails }> {
  await ensureAuthorized();
  const res = deployShop(id, domain);

  if (domain) {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const zone = process.env.CLOUDFLARE_ZONE_ID;
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (token && zone && account) {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        } as const;

        const dns = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              type: "CNAME",
              name: domain,
              content: `${id}.pages.dev`,
              ttl: 1,
              proxied: true,
            }),
          },
        ).then((r) => r.json());

        const cert = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${id}/domains`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ name: domain }),
          },
        ).then((r) => r.json());

        const info: ShopDomainDetails = {
          domain,
          dnsRecordId: dns?.result?.id,
          status: cert?.result?.status,
        };
        await setShopDomain(id, info);
        return { ...res, domain: info };
      } catch (err) {
        console.error("Cloudflare domain setup failed", err);
      }
    } else {
      console.warn("Missing Cloudflare configuration; skipping domain setup");
    }
  }

  return res;
}

export async function getDeployStatus(
  id: string
): Promise<DeployShopResult | { status: "pending"; error?: string }> {
  await ensureAuthorized();
  try {
    const file = path.join(
      resolveRepoRoot(),
      "data",
      "shops",
      id,
      "deploy.json"
    );
    const content = await fs.readFile(file, "utf8");
    return JSON.parse(content) as DeployShopResult;
  } catch (err) {
    console.error("Failed to read deploy status", err);
    return { status: "pending", error: (err as Error).message };
  }
}
