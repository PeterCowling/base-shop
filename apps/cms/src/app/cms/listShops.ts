// apps/cms/src/app/cms/listShops.ts

import fsSync from "node:fs";
import fs from "node:fs/promises";

import path from "node:path";

function resolveDataRoot(): string {
  let dir = process.cwd();

  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached FS root
    dir = parent;
  }

  return path.resolve(process.cwd(), "data", "shops");
}

export async function listShops(): Promise<string[]> {
  const shopsDir = resolveDataRoot();

  try {
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err) {
    console.error(`Failed to list shops at ${shopsDir}:`, err);
    throw err;
  }
}
