import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function readUpgradeMeta(root: string, id: string): unknown {
  const file = join(root, "data", "shops", id, "upgrade.json");
  return JSON.parse(readFileSync(file, "utf8"));
}

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

export function republishShop(id: string, root = process.cwd()): void {
  const upgradeFile = join(root, "data", "shops", id, "upgrade.json");
  if (existsSync(upgradeFile)) {
    readUpgradeMeta(root, id);
  }
  run("pnpm", ["--filter", `apps/${id}`, "build"]);
  run("pnpm", ["--filter", `apps/${id}`, "deploy"]);
  updateStatus(root, id);
  if (existsSync(upgradeFile)) {
    unlinkSync(upgradeFile);
  }
}

function main(): void {
  const shopId = process.argv[2];
  if (!shopId) {
    console.error(
      "Usage: pnpm ts-node scripts/src/republish-shop.ts <shopId>"
    );
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
