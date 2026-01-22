import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

function main(): void {
  const root = join(__dirname, "..");
  const dataDir = join(root, "data");
  const shopsDir = join(dataDir, "shops");
  mkdirSync(shopsDir, { recursive: true });

  for (const entry of readdirSync(dataDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "shops") continue;
    const legacyPages = join(dataDir, entry.name, "pages.json");
    if (!existsSync(legacyPages)) continue;

    const targetDir = join(shopsDir, entry.name);
    const targetFile = join(targetDir, "pages.json");
    if (existsSync(targetFile)) {
      console.log(`Skipping ${entry.name}; already migrated`);
      continue;
    }

    mkdirSync(targetDir, { recursive: true });
    renameSync(legacyPages, targetFile);
    console.log(`Moved pages for ${entry.name}`);

    try {
      if (readdirSync(join(dataDir, entry.name)).length === 0) {
        rmSync(join(dataDir, entry.name));
      }
    } catch {
      // ignore errors cleaning up
    }
  }
}

main();
