import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

/**
 * Copy test fixtures into the directory pointed to by `TEST_DATA_ROOT`.
 * Existing shop data will be removed before copying to ensure fresh files.
 */
export function seedTestData(): void {
  const root = process.env.TEST_DATA_ROOT;
  if (!root) {
    throw new Error("TEST_DATA_ROOT environment variable is required");
  }

  const srcRoot = join("test", "data", "shops");
  const destRoot = join(root, "shops");

  mkdirSync(destRoot, { recursive: true });

  const shops = readdirSync(srcRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const shop of shops) {
    const srcDir = join(srcRoot, shop);
    const destDir = join(destRoot, shop);
    rmSync(destDir, { recursive: true, force: true });
    cpSync(srcDir, destDir, { recursive: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    seedTestData();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
