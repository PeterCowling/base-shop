import type { ReturnLogistics } from "@acme/types";
import { returnLogisticsSchema } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveDataRoot } from "./dataRoot";

let cached: ReturnLogistics | null = null;

export async function getReturnLogistics(): Promise<ReturnLogistics> {
  if (cached) return cached;
  const file = path.join(resolveDataRoot(), "..", "return-logistics.json");
  const buf = await fs.readFile(file, "utf8");
  cached = returnLogisticsSchema.parse(JSON.parse(buf));
  return cached;
}
