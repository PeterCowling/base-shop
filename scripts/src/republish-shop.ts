import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function readUpgradeMeta(id: string): unknown {
  const file = join("data", "shops", id, "upgrade.json");
  return JSON.parse(readFileSync(file, "utf8"));
}

function run(cmd: string, args: string[]): void {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function updateStatus(id: string): void {
  const file = join("data", "shops", id, "shop.json");
  const json = JSON.parse(readFileSync(file, "utf8"));
  json.status = "published";
  writeFileSync(file, JSON.stringify(json, null, 2));
}

function main(): void {
  const shopId = process.argv[2];
  if (!shopId) {
    console.error("Usage: republish-shop <shopId>");
    process.exit(1);
  }
  readUpgradeMeta(shopId);
  run("pnpm", ["--filter", `apps/${shopId}`, "build"]);
  run("pnpm", ["--filter", `apps/${shopId}`, "deploy"]);
  updateStatus(shopId);
}

main();
