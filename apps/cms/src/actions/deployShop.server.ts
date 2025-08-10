// apps/cms/src/actions/deployShop.server.ts
"use server";

import { authOptions } from "@cms/auth/options";
import {
  deployShop,
  type DeployShopResult,
  type DeployStatusBase,
} from "@platform-core/createShop";
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

async function provisionDomain(
  id: string,
  domain: string
): Promise<"pending" | "error"> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !zone || !account) return "error";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } as const;

  try {
    // Associate custom domain with Pages project
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${id}/domains`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ name: domain }),
      }
    );

    // Create DNS record pointing to Pages deployment
    await fetch(
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
      }
    );

    return "pending";
  } catch (err) {
    console.error("Cloudflare provisioning failed", err);
    return "error";
  }
}

async function writeDeployStatus(id: string, data: DeployStatusBase): Promise<void> {
  try {
    const file = path.join(
      resolveRepoRoot(),
      "data",
      "shops",
      id,
      "deploy.json"
    );
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write deploy status", err);
  }
}

export async function deployShopHosting(
  id: string,
  domain?: string
): Promise<DeployShopResult> {
  await ensureAuthorized();
  const result = deployShop(id, domain) as DeployShopResult & {
    domain?: string;
    domainStatus?: "pending" | "active" | "error";
  };

  if (domain) {
    const status = await provisionDomain(id, domain);
    result.domain = domain;
    result.domainStatus = status;
    await writeDeployStatus(id, result);
  }

  return result;
}

async function checkDomainStatus(
  id: string,
  domain: string
): Promise<"pending" | "active" | "error" | undefined> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) return undefined;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${id}/domains/${domain}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) return undefined;
    const json = (await res.json()) as {
      result?: { status?: "pending" | "active" | "error" };
    };
    return json.result?.status;
  } catch (err) {
    console.error("Failed to check domain status", err);
    return undefined;
  }
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
    const data = JSON.parse(content) as DeployShopResult & {
      domain?: string;
      domainStatus?: "pending" | "active" | "error";
    };

    if (data.domain) {
      const status = await checkDomainStatus(id, data.domain);
      if (status && status !== data.domainStatus) {
        data.domainStatus = status;
        await writeDeployStatus(id, data);
      }
    }

    return data;
  } catch (err) {
    console.error("Failed to read deploy status", err);
    return { status: "pending", error: (err as Error).message };
  }
}
