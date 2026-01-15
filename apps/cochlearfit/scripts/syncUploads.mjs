/* eslint-disable security/detect-non-literal-fs-filename -- DS-9999 [ttl=2026-12-31] Script traverses workspace folders dynamically to sync uploads */
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const SHOP_ID = "cochlearfit";

function resolveDataRoot() {
  let dir = process.cwd();
  let found;

  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) {
      found = candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return found ?? path.join(process.cwd(), "data", "shops");
}

async function main() {
  const dataRoot = resolveDataRoot();
  const sourceDir = path.join(dataRoot, SHOP_ID, "uploads");
  const targetDir = path.join(process.cwd(), "public", "uploads", SHOP_ID);

  await fs.mkdir(targetDir, { recursive: true });

  let entries = [];
  try {
    entries = await fs.readdir(sourceDir, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name !== "metadata.json")
      .map(async (name) => {
        const src = path.join(sourceDir, name);
        const dest = path.join(targetDir, name);
        await fs.copyFile(src, dest);
      }),
  );
}

await main();
