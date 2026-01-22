// scripts/src/shop/createShopAndSeed.ts
// Create a shop, optionally seed it, apply page templates, and write env files.

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readEnvFile } from "@acme/platform-core/configurator";
import {
  createShop,
  type CreateShopOptions,
} from "@acme/platform-core/createShop";
import type { ProviderInfo } from "@acme/platform-core/createShop/listProviders";

import { applyPageTemplate } from "../apply-page-template";
import type { Flags } from "../cli/parseQuickstartArgs";
import { seedShop } from "../seedShop";

export async function createShopAndSeed(
  prefixedId: string,
  options: CreateShopOptions,
  flags: Flags,
  pageTemplate: string | undefined,
  paymentProviders: ProviderInfo[],
  shippingProviders: ProviderInfo[],
): Promise<void> {
  await createShop(prefixedId, options);

  if (flags.seedFull) {
    seedShop(prefixedId, undefined, true);
  } else if (flags.seed) {
    seedShop(prefixedId);
  }

  if (pageTemplate) {
    await applyPageTemplate(prefixedId, pageTemplate);
  }

  if (flags.autoEnv) {
    const envVars = new Set<string>();
    const providerMap = new Map<string, readonly string[]>();
    paymentProviders.forEach((p) => providerMap.set(p.id, p.envVars));
    shippingProviders.forEach((p) => providerMap.set(p.id, p.envVars));
    for (const id of [...options.payment, ...options.shipping]) {
      const vars = providerMap.get(id) ?? [];
      vars.forEach((v) => envVars.add(v));
    }
    const envPath = join("apps", prefixedId, ".env");
    let existing: Record<string, string> = {};
    if (existsSync(envPath)) {
      existing = readEnvFile(envPath);
    }
    for (const key of envVars) {
      if (!existing[key]) {
        existing[key] = process.env[key] ?? `TODO_${key}`;
      }
    }
    writeFileSync(
      envPath,
      Object.entries(existing)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n",
    );
  }
}
