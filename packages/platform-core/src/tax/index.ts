// packages/platform-core/src/tax/index.ts

import "server-only";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { shippingEnv } from "@acme/config/env/shipping";
import { resolveDataRoot } from "../dataRoot";

export interface TaxCalculationRequest {
  provider: "taxjar";
  amount: number;
  toCountry: string;
  toPostalCode?: string;
}

let rulesCache: Record<string, number> | null = null;

async function loadRules() {
  if (rulesCache) return rulesCache;
  const file = path.join(resolveDataRoot(), "..", "tax", "rules.json");
  const buf = await fs.readFile(file, "utf8");
  rulesCache = JSON.parse(buf) as Record<string, number>;
  return rulesCache;
}

export async function getTaxRate(region: string): Promise<number> {
  const rules = await loadRules();
  return rules[region] ?? 0;
}

/**
 * Calculate taxes using the configured provider API.
 */
export async function calculateTax({ provider, ...payload }: TaxCalculationRequest): Promise<unknown> {
  const apiKey = (shippingEnv as Record<string, string | undefined>)[
    `${provider.toUpperCase()}_KEY`
  ];
  if (!apiKey) {
    throw new Error(`Missing ${provider.toUpperCase()}_KEY`);
  }

  const url = "https://api.taxjar.com/v2/taxes";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to calculate tax with ${provider}`);
  }

  return res.json();
}
