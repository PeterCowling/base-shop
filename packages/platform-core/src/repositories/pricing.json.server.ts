/* eslint-disable security/detect-non-literal-fs-filename -- ABC-123: Paths are derived from controlled DATA_ROOT + validated inputs */
import "server-only";

import { pricingSchema, type PricingMatrix } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "path";
import { resolveDataRoot } from "../dataRoot";

function pricingPath(): string {
  return path.join(resolveDataRoot(), "..", "rental", "pricing.json");
}

async function read(): Promise<PricingMatrix> {
  const buf = await fs.readFile(pricingPath(), "utf8");
  const parsed = pricingSchema.safeParse(JSON.parse(buf));
  if (!parsed.success) {
    throw new Error("Invalid pricing data"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
  }
  return parsed.data;
}

async function write(data: PricingMatrix): Promise<void> {
  const parsed = pricingSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid pricing data"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
  }
  const file = pricingPath();
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(parsed.data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export const jsonPricingRepository = {
  read,
  write,
};
