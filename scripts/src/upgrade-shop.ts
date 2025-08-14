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
import * as path from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { getComponentNameMap } from "./component-names";

const args = process.argv.slice(2);
const rollback = args.includes("--rollback");
const slug = args.find((a) => !a.startsWith("--"));

if (!slug) {
  console.error(
    "Usage: pnpm ts-node scripts/src/upgrade-shop.ts <shop-slug> [--rollback]"
  );
  process.exit(1);
}

const shopId = slug.startsWith("shop-") ? slug : `shop-${slug}`;
const rootDir = path.resolve(__dirname, "..", "..");
const appDir = path.join(rootDir, "apps", shopId);
const templateDir = path.join(rootDir, "packages", "template-app");
const shopJsonPath = path.join(rootDir, "data", "shops", shopId, "shop.json");

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
    delete (data as any).componentVersions;
    writeFileSync(shopJsonPath, JSON.stringify(data, null, 2));
  }
  console.log(`Rollback completed for ${shopId}`);
  process.exit(0);
}

copyTemplate(templateDir, appDir);

// track metadata about the upgrade for later publishing
let componentVersions: Record<string, string> = {};
const timestamp = new Date().toISOString();
if (existsSync(shopJsonPath)) {
  cpSync(shopJsonPath, shopJsonPath + ".bak");
  const data = JSON.parse(readFileSync(shopJsonPath, "utf8"));
  (data as any).lastUpgrade = timestamp;
  const pkgPath = path.join(appDir, "package.json");
  componentVersions = existsSync(pkgPath)
    ? (JSON.parse(readFileSync(pkgPath, "utf8")).dependencies ?? {})
    : {};
  (data as any).componentVersions = componentVersions;
  writeFileSync(shopJsonPath, JSON.stringify(data, null, 2));
}

// generate upgrade-changes.json with metadata for changed components only
const componentsDir = path.join(rootDir, "packages", "ui", "src", "components");
const componentMap = getComponentNameMap(componentsDir);
const changedComponents = Object.entries(componentMap).flatMap(
  ([file, componentName]) => {
    const destPath = path.join(appDir, "src", "components", file);
    const bakPath = destPath + ".bak";
    if (!existsSync(destPath) || !existsSync(bakPath)) return [];
    const newHash = createHash("sha256")
      .update(readFileSync(destPath))
      .digest("hex");
    const oldHash = createHash("sha256")
      .update(readFileSync(bakPath))
      .digest("hex");
    if (newHash === oldHash) return [];
    return [
      { file, componentName, oldChecksum: oldHash, newChecksum: newHash },
    ];
  }
);
writeFileSync(
  path.join(appDir, "upgrade-changes.json"),
  JSON.stringify({ components: changedComponents }, null, 2)
);

// write upgrade metadata for republishing
writeFileSync(
  path.join(rootDir, "data", "shops", shopId, "upgrade.json"),
  JSON.stringify(
    {
      timestamp,
      componentVersions,
      components: changedComponents,
    },
    null,
    2
  )
);

const envPath = path.join(appDir, ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  if (!envContent.includes("UPGRADE_PREVIEW_TOKEN_SECRET=")) {
    const upgradeToken = randomBytes(32).toString("hex");
    writeFileSync(
      envPath,
      envContent + `\nUPGRADE_PREVIEW_TOKEN_SECRET=${upgradeToken}\n`
    );
  }
}

console.log(
  `Upgrade staged for ${shopId}. Backups saved with .bak extension. Use --rollback to undo.`
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
