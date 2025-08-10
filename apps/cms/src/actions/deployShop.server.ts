// apps/cms/src/actions/deployShop.server.ts
"use server";

import { deployShop, type DeployShopResult } from "@platform-core/createShop";
import { setDomain, type DomainInfo } from "@platform-core/src/shops";
import type { Shop } from "@types";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureAuthorized } from "./common/auth";

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
  return deployShop(id, domain);
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

export async function updateDeployStatus(
  id: string,
  data: Partial<DeployShopResult> & { domain?: string; domainStatus?: string }
): Promise<void> {
  await ensureAuthorized();
  const file = path.join(
    resolveRepoRoot(),
    "data",
    "shops",
    id,
    "deploy.json"
  );
  try {
    const existing = await fs.readFile(file, "utf8").catch(() => "{}");
    const parsed = JSON.parse(existing) as Record<string, unknown>;
    const updated = { ...parsed, ...data };
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(updated, null, 2), "utf8");
    if (data.domain) {
      const shopFile = path.join(
        resolveRepoRoot(),
        "data",
        "shops",
        id,
        "shop.json"
      );
      try {
        const shopRaw = await fs.readFile(shopFile, "utf8").catch(() => "{}");
        const shopData = JSON.parse(shopRaw) as Shop;
        const domainInfo: DomainInfo = {
          name: data.domain,
          status: data.domainStatus,
        };
        const updatedShop = setDomain(shopData, domainInfo);
        await fs.writeFile(
          shopFile,
          JSON.stringify(updatedShop, null, 2),
          "utf8"
        );
      } catch (err) {
        console.error("Failed to update shop domain", err);
      }
    }
  } catch (err) {
    console.error("Failed to write deploy status", err);
  }
}
