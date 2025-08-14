import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function run(cmd: string, args: string[]): void {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with status ${res.status}`);
  }
}

function updateStatus(root: string, id: string): void {
  const file = join(root, "data", "shops", id, "shop.json");
  const json = JSON.parse(readFileSync(file, "utf8"));
  json.status = "published";
  writeFileSync(file, JSON.stringify(json, null, 2));
}

export function rollbackShop(id: string, root = process.cwd()): void {
  const dir = join(root, "data", "shops", id);
  const historyFile = join(dir, "history.json");
  if (!existsSync(historyFile)) {
    throw new Error("No history available");
  }
  const history = JSON.parse(readFileSync(historyFile, "utf8"));
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error("No history available");
  }
  const shopFile = join(dir, "shop.json");
  const shop = JSON.parse(readFileSync(shopFile, "utf8"));
  const current = {
    componentVersions: shop.componentVersions ?? {},
    lastUpgrade: shop.lastUpgrade,
    timestamp: new Date().toISOString(),
  };
  const previous = history.pop();
  history.push(current);
  writeFileSync(historyFile, JSON.stringify(history, null, 2));
  shop.componentVersions = previous.componentVersions ?? {};
  if (previous.lastUpgrade) shop.lastUpgrade = previous.lastUpgrade;
  writeFileSync(shopFile, JSON.stringify(shop, null, 2));
  const pkgFile = join(root, "apps", id, "package.json");
  if (existsSync(pkgFile)) {
    const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
    pkg.dependencies = previous.componentVersions || {};
    writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
  }
  run("pnpm", ["--filter", `apps/${id}`, "install"]);
  run("pnpm", ["--filter", `apps/${id}`, "build"]);
  run("pnpm", ["--filter", `apps/${id}`, "deploy"]);
  updateStatus(root, id);
}

function main(): void {
  const shopId = process.argv[2];
  if (!shopId) {
    console.error("Usage: pnpm ts-node scripts/src/rollback-shop.ts <shopId>");
    process.exit(1);
  }
  try {
    rollbackShop(shopId);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
