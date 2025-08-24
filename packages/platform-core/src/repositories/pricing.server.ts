import "server-only";

import { pricingSchema, type PricingMatrix } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { resolveDataRoot } from "../dataRoot";

function pricingPath(): string {
  return path.join(resolveDataRoot(), "..", "rental", "pricing.json");
}

export async function readPricing(): Promise<PricingMatrix> {
  const buf = await fs.readFile(pricingPath(), "utf8");
  const parsed = pricingSchema.safeParse(JSON.parse(buf));
  if (!parsed.success) {
    throw new Error("Invalid pricing data");
  }
  return parsed.data;
}

export async function writePricing(data: PricingMatrix): Promise<void> {
  const file = pricingPath();
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}
