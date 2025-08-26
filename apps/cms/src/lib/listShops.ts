// apps/cms/src/lib/listShops.ts

import fs from "fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";

export async function listShops(): Promise<string[]> {
  const shopsDir = resolveDataRoot();

  try {
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err: unknown) {
    // Surface configuration errors clearly: the absence of the `data/shops`
    // directory means we cannot determine available shops.  Upstream code and
    // tests expect this to be treated as an exceptional situation rather than
    // silently returning an empty list.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const message = `Shops directory not found at ${shopsDir}`;
      console.error(message);
      throw new Error(message);
    }
    console.error(`Failed to list shops at ${shopsDir}:`, err);
    throw err;
  }
}
