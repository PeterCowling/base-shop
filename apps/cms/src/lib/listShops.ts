// apps/cms/src/lib/listShops.ts

import fs from "fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";

export async function listShops(): Promise<string[]> {
  const shopsDir = resolveDataRoot();

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: shopsDir is validated by resolveDataRoot()
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err: unknown) {
    // If the shops directory hasn't been created yet, treat it as having
    // no shops rather than throwing. This allows callers to handle the empty
    // state gracefully.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    console.error(`Failed to list shops at ${shopsDir}:`, err);
    throw err;
  }
}
