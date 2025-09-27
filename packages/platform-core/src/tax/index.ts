// packages/platform-core/src/tax/index.ts

import "server-only";
import { promises as fs } from "fs";
import * as path from "path";
import { loadShippingEnv } from "@acme/config/env/shipping";
import { resolveDataRoot } from "../dataRoot";


const shippingEnv = loadShippingEnv();
export interface TaxCalculationRequest {
  provider: "taxjar";
  amount: number;
  toCountry: string;
  toPostalCode?: string;
}

export interface TaxCalculationResult {
  tax: number;
}

let rulesCache: Record<string, number> | null = null;

async function loadRules() {
  if (rulesCache) return rulesCache;
  const base = path.resolve(resolveDataRoot(), "..", "tax");
  const file = path.resolve(base, "rules.json");
  try {
    if (!file.startsWith(base + path.sep)) {
      throw new Error("Resolved path escapes base directory"); // i18n-exempt -- CORE-1010 internal error message
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized against base
    const buf = await fs.readFile(file, "utf8");
    rulesCache = JSON.parse(buf) as Record<string, number>;
  } catch (err: unknown) {
    // If the file is missing, fall back to an empty ruleset so tax
    // calculations can proceed without configuration. This mirrors the
    // behaviour in production where tax rules are optional for tests and
    // local development environments.
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      rulesCache = {};
    } else {
      throw err;
    }
  }
  return rulesCache;
}

export async function getTaxRate(region: string): Promise<number> {
  const rules = await loadRules();
  return rules[region] ?? 0;
}

/**
 * Calculate taxes using the configured provider API.
 */
export async function calculateTax({
  provider,
  ...payload
}: TaxCalculationRequest): Promise<TaxCalculationResult> {
  const apiKey = (shippingEnv as Record<string, string | undefined>)[
    `${provider.toUpperCase()}_KEY`
  ];
  if (!apiKey) {
    throw new Error(`Missing ${provider.toUpperCase()}_KEY`);
  }

  const url = "https://api.taxjar.com/v2/taxes";
  try {
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

    const data: TaxCalculationResult = await res.json();
    return data;
  } catch {
    throw new Error(`Failed to calculate tax with ${provider}`);
  }
}
