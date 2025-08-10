// apps/cms/src/actions/deployShop.server.ts
"use server";

import { authOptions } from "@cms/auth/options";
import {
  deployShop,
  type DeployShopResult,
  type DomainProvision,
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

export async function deployShopHosting(
  id: string,
  domain?: string
): Promise<DeployShopResult> {
  await ensureAuthorized();
  const result = deployShop(id, domain);

  if (domain) {
    try {
      const updated = await provisionDomain(id, domain);
      result.domain = updated;
      await writeDeployFile(id, result);
    } catch (err) {
      result.domain = {
        name: domain,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      };
      await writeDeployFile(id, result);
    }
  }

  return result;
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
    const data = JSON.parse(content) as DeployShopResult;
    if (data.domain && data.domain.status === "pending") {
      try {
        const status = await checkDomain(id, data.domain.name);
        data.domain.status = status.status;
        data.domain.error = status.error;
        await writeDeployFile(id, data);
      } catch (err) {
        data.domain.status = "error";
        data.domain.error = err instanceof Error ? err.message : String(err);
        await writeDeployFile(id, data);
      }
    }
    return data;
  } catch (err) {
    console.error("Failed to read deploy status", err);
    return { status: "pending", error: (err as Error).message };
  }
}

async function writeDeployFile(id: string, data: DeployShopResult) {
  const file = path.join(
    resolveRepoRoot(),
    "data",
    "shops",
    id,
    "deploy.json"
  );
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function provisionDomain(
  project: string,
  domain: string
): Promise<DomainProvision> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !account || !zone)
    throw new Error("Missing Cloudflare configuration");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "CNAME",
      name: domain,
      content: `${project}.pages.dev`,
      ttl: 1,
      proxied: true,
    }),
  });

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${project}/domains`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: domain }),
    }
  );

  return { name: domain, status: "pending" };
}

async function checkDomain(project: string, domain: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) throw new Error("Missing Cloudflare configuration");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${project}/domains/${domain}`,
    { headers }
  );
  const json = (await res.json()) as {
    result?: { status: "pending" | "active"; error?: string };
  };
  return {
    status: json.result?.status ?? "pending",
    error: json.result?.error,
  };
}
