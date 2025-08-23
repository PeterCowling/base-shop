// apps/cms/src/app/cms/listShops.ts

import fs from "fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";

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
