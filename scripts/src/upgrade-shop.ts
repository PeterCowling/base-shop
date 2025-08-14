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
import { nowIso } from "@date-utils";
import { getComponentNameMap } from "./component-names";
import { generateExampleProps } from "./generate-example-props";
import type { Page, ShopMetadata } from "@acme/types";

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
const pkgPath = path.join(appDir, "package.json");

if (!existsSync(appDir)) {
  console.error(`Shop app does not exist: ${appDir}`);
  process.exit(1);
}

if (rollback) {
  restoreBackups(appDir);
  restoreBackups(path.dirname(shopJsonPath));
  if (existsSync(shopJsonPath)) {
    const data = JSON.parse(readFileSync(shopJsonPath, "utf8")) as ShopMetadata;
    delete data.lastUpgrade;
    delete data.componentVersions;
    writeFileSync(shopJsonPath, JSON.stringify(data, null, 2));
  }
  console.log(`Rollback completed for ${shopId}`);
  process.exit(0);
}

copyTemplate(templateDir, appDir);

generateExampleProps(shopId, rootDir);

if (existsSync(shopJsonPath)) {
  cpSync(shopJsonPath, shopJsonPath + ".bak");
  const data = JSON.parse(readFileSync(shopJsonPath, "utf8")) as ShopMetadata;
  data.lastUpgrade = nowIso();
  data.componentVersions = existsSync(pkgPath)
    ? (JSON.parse(readFileSync(pkgPath, "utf8")).dependencies ?? {})
    : {};
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
// determine pages that reference updated components
const pagesJsonPath = path.join(rootDir, "data", "shops", shopId, "pages.json");
const pageIds = new Set<string>();
if (existsSync(pagesJsonPath)) {
  try {
    const parsed = JSON.parse(readFileSync(pagesJsonPath, "utf8"));
    const pages: Page[] = Array.isArray(parsed) ? parsed : [];
    const changedTypes = new Set(changedComponents.map((c) => c.componentName));
    for (const page of pages) {
      if (!Array.isArray(page.components)) continue;
      const hasMatch = page.components.some((comp) =>
        changedTypes.has(comp.type)
      );
      if (hasMatch) {
        pageIds.add(page.id);
      }
    }
  } catch {
    // ignore parsing errors
  }
}

writeFileSync(
  path.join(appDir, "upgrade-changes.json"),
  JSON.stringify(
    { components: changedComponents, pages: Array.from(pageIds) },
    null,
    2
  )
);

const upgradeMetaPath = path.join(
  rootDir,
  "data",
  "shops",
  shopId,
  "upgrade.json"
);
const componentVersions = existsSync(pkgPath)
  ? (JSON.parse(readFileSync(pkgPath, "utf8")).dependencies ?? {})
  : {};
writeFileSync(
  upgradeMetaPath,
  JSON.stringify(
    {
      timestamp: nowIso(),
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
