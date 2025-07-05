import type { ReturnLogistics } from "@types";
import { returnLogisticsSchema } from "@types";
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";

function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

let cached: ReturnLogistics | null = null;

export async function getReturnLogistics(): Promise<ReturnLogistics> {
  if (cached) return cached;
  const file = path.join(resolveDataRoot(), "..", "return-logistics.json");
  const buf = await fs.readFile(file, "utf8");
  cached = returnLogisticsSchema.parse(JSON.parse(buf));
  return cached;
}
