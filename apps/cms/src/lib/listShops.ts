// apps/cms/src/lib/listShops.ts

import fs from "fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";

export async function listShops(): Promise<string[]> {
  const shopsDir = resolveDataRoot();

  try {
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err: unknown) {
    // If the shops directory doesn't exist yet, treat it as having no shops
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    console.error(`Failed to list shops at ${shopsDir}:`, err);
    throw err;
  }
}
