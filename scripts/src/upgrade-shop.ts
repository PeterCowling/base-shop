import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  renameSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildComponentExportMap, resolveComponentName } from "./upgrade-utils";
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function main() {
  const args = process.argv.slice(2);
  const rollback = args.includes("--rollback");
  const slug = args.find((a) => !a.startsWith("--"));

  if (!slug) {
    console.error(
      "Usage: pnpm ts-node scripts/src/upgrade-shop.ts <shop-slug> [--rollback]",
    );
    process.exit(1);
  }

  const shopId = slug.startsWith("shop-") ? slug : `shop-${slug}`;
  const rootDir = path.resolve(dirname, "..", "..");
  const appDir = path.join(rootDir, "apps", shopId);
  const templateDir = path.join(rootDir, "packages", "template-app");
  const shopJsonPath = path.join(rootDir, "data", "shops", shopId, "shop.json");
  const changesPath = path.join(appDir, "upgrade-changes.json");
  const componentMap = buildComponentExportMap(
    path.join(rootDir, "packages", "ui", "src", "components"),
  );
  const changes: { file: string; componentName: string }[] = [];

  if (!existsSync(appDir)) {
    console.error(`Shop app does not exist: ${appDir}`);
    process.exit(1);
  }

  if (rollback) {
    restoreBackups(appDir);
    restoreBackups(path.dirname(shopJsonPath));
    if (existsSync(shopJsonPath)) {
      const data = JSON.parse(readFileSync(shopJsonPath, "utf8"));
      delete (data as any).lastUpgrade;
      writeFileSync(shopJsonPath, JSON.stringify(data, null, 2));
    }
    if (existsSync(changesPath)) unlinkSync(changesPath);
    console.log(`Rollback completed for ${shopId}`);
    process.exit(0);
  }

  copyTemplate(templateDir, appDir);
  writeFileSync(changesPath, JSON.stringify({ components: changes }, null, 2));

  if (existsSync(shopJsonPath)) {
    cpSync(shopJsonPath, shopJsonPath + ".bak");
    const data = JSON.parse(readFileSync(shopJsonPath, "utf8"));
    (data as any).lastUpgrade = new Date().toISOString();
    writeFileSync(shopJsonPath, JSON.stringify(data, null, 2));
  }

  console.log(
    `Upgrade staged for ${shopId}. Backups saved with .bak extension. Use --rollback to undo.`,
  );

  function copyTemplate(srcDir: string, destDir: string) {
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      if (["node_modules", "dist", ".next"].includes(entry.name)) continue;
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        mkdirSync(destPath, { recursive: true });
        copyTemplate(srcPath, destPath);
      } else {
        if (existsSync(destPath)) {
          cpSync(destPath, destPath + ".bak");
        }
        cpSync(srcPath, destPath);
        const name = resolveComponentName(destPath, componentMap);
        if (name) {
          changes.push({
            file: path.relative(appDir, destPath),
            componentName: name,
          });
        }
      }
    }
  }

  function restoreBackups(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        restoreBackups(full);
        continue;
      }
      if (!entry.name.endsWith(".bak")) continue;
      const original = full.slice(0, -4);
      if (existsSync(original)) unlinkSync(original);
      renameSync(full, original);
    }
  }
}

if (path.resolve(process.argv[1] ?? "") === filename) {
  main();
}

