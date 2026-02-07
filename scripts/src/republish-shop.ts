import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const SHOP_ID_REGEX = /^[a-z0-9_-]+$/;

function readUpgradeMeta(root: string, id: string): unknown {
  const file = join(root, "data", "shops", id, "upgrade.json");
  return JSON.parse(readFileSync(file, "utf8"));
}

function run(cmd: string, args: string[]): void {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} failed with status ${res.status}`
    );
  }
}

function updateStatus(root: string, id: string): void {
  const file = join(root, "data", "shops", id, "shop.json");
  const json = JSON.parse(readFileSync(file, "utf8"));
  json.status = "published";
  const pkgPath = join(root, "apps", id, "package.json");
  json.componentVersions = existsSync(pkgPath)
    ? JSON.parse(readFileSync(pkgPath, "utf8")).dependencies ?? {}
    : {};
  writeFileSync(file, JSON.stringify(json, null, 2));
}

function removeBakFiles(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeBakFiles(filePath);
    } else if (entry.isFile() && filePath.endsWith(".bak")) {
      unlinkSync(filePath);
    }
  }
}

function saveHistory(root: string, id: string): void {
  const dir = join(root, "data", "shops", id);
  const shopFile = join(dir, "shop.json");
  const historyFile = join(dir, "history.json");
  if (!existsSync(shopFile)) return;
  const current = JSON.parse(readFileSync(shopFile, "utf8"));
  const entry = {
    componentVersions: current.componentVersions ?? {},
    lastUpgrade: current.lastUpgrade,
    timestamp: new Date().toISOString(),
  };
  const history = existsSync(historyFile)
    ? JSON.parse(readFileSync(historyFile, "utf8"))
    : [];
  history.push(entry);
  writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

function auditRepublish(root: string, id: string): void {
  try {
    const file = join(root, "data", "shops", id, "audit.log");
    const entry = { action: "republish", timestamp: new Date().toISOString() };
    appendFileSync(file, JSON.stringify(entry) + "\n");
  } catch {
    // ignore audit errors
  }
}

export function republishShop(id: string, root = process.cwd()): void {
  if (!SHOP_ID_REGEX.test(id)) {
    throw new Error(`Invalid shop ID: ${id}`);
  }
  const upgradeFile = join(root, "data", "shops", id, "upgrade.json");
  if (existsSync(upgradeFile)) {
    readUpgradeMeta(root, id);
    unlinkSync(upgradeFile);
  }
  saveHistory(root, id);
  run("pnpm", ["--filter", `apps/${id}`, "build"]);
  run("pnpm", ["--filter", `apps/${id}`, "deploy"]);
  updateStatus(root, id);
  if (existsSync(upgradeFile)) {
    unlinkSync(upgradeFile);
  }
  const appDir = join(root, "apps", id);
  const upgradeChanges = join(appDir, "upgrade-changes.json");
  if (existsSync(upgradeChanges)) {
    unlinkSync(upgradeChanges);
  }
  removeBakFiles(appDir);
  auditRepublish(root, id);
}

function main(): void {
  const shopId = process.argv[2];
  if (!shopId) {
    console.error("Usage: pnpm ts-node scripts/src/republish-shop.ts <shopId>");
    process.exit(1);
  }
  try {
    republishShop(shopId);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
