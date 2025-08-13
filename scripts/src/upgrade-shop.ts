import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { validateShopName } from "../../packages/platform-core/src/shops";

function usage() {
  console.error("Usage: pnpm ts-node scripts/src/upgrade-shop.ts <shopId> [--stage]");
}

function main(): void {
  const args = process.argv.slice(2);
  const applyStage = args.includes("--stage") || args.includes("--apply");
  const shopArg = args.find((a) => !a.startsWith("--"));
  if (!shopArg) {
    usage();
    process.exit(1);
  }

  let shopId = shopArg;
  try {
    shopId = shopId.startsWith("shop-") ? shopId : `shop-${validateShopName(shopId)}`;
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const root = join(__dirname, "..", "..");
  const templateDir = join(root, "packages", "template-app");
  const shopDir = join(root, "apps", shopId);

  if (!existsSync(shopDir)) {
    console.error(`Shop directory not found: ${shopDir}`);
    process.exit(1);
  }

  const tempDir = mkdtempSync(join(tmpdir(), "template-"));
  cpSync(templateDir, tempDir, {
    recursive: true,
    filter: (src) => !src.includes(`${sep}node_modules${sep}`) && !src.endsWith(`${sep}node_modules`),
  });

  const diff = spawnSync("git", ["diff", "--no-index", "--name-status", tempDir, shopDir], {
    encoding: "utf8",
  });
  if (diff.status && diff.status > 1) {
    console.error(diff.stderr);
    rmSync(tempDir, { recursive: true, force: true });
    process.exit(diff.status);
  }

  const lines = diff.stdout.trim().split(/\r?\n/).filter(Boolean);
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  for (const line of lines) {
    const [status, file] = line.split(/\s+/);
    if (!status || !file) continue;
    let rel: string;
    switch (status) {
      case "D": // present in template only
        rel = relative(tempDir, file);
        added.push(rel);
        break;
      case "A": // present in shop only
        rel = relative(shopDir, file);
        removed.push(rel);
        break;
      case "M":
        rel = relative(tempDir, file);
        modified.push(rel);
        break;
      default:
        break;
    }
  }

  const manifest = { added, removed, modified };
  writeFileSync(join(shopDir, "upgrade-changes.json"), JSON.stringify(manifest, null, 2));

  if (applyStage) {
    const stagingDir = join(shopDir, "staging");
    rmSync(stagingDir, { recursive: true, force: true });
    for (const file of [...added, ...modified]) {
      const src = join(tempDir, file);
      const dest = join(stagingDir, file);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest, { recursive: true });
    }
  }

  rmSync(tempDir, { recursive: true, force: true });
}

main();

