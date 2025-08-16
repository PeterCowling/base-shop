// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
import { execSync } from "node:child_process";
import { parseArgs } from "./createShop/parse";
import { gatherOptions } from "./createShop/prompts";
import { writeShop } from "./createShop/write";
import { ensureTemplateExists } from "../../packages/platform-core/src/createShop.ts";

function ensureRuntime() {
  const nodeMajor = Number(process.version.replace(/^v/, "").split(".")[0]);
  if (nodeMajor < 20) {
    console.error(
      `Node.js v20 or later is required. Current version: ${process.version}`
    );
    process.exit(1);
  }

  let pnpmVersion: string;
  try {
    pnpmVersion = execSync("pnpm --version", { encoding: "utf8" }).trim();
  } catch {
    console.error("Failed to determine pnpm version. pnpm v10 or later is required.");
    process.exit(1);
  }

  const pnpmMajor = Number(pnpmVersion.split(".")[0]);
  if (pnpmMajor < 10) {
    console.error(
      `pnpm v10 or later is required. Current version: ${pnpmVersion}`
    );
    process.exit(1);
  }
}

ensureRuntime();

const { shopId, options, themeProvided, templateProvided } = parseArgs(
  process.argv.slice(2)
);
if (themeProvided || templateProvided) {
  try {
    ensureTemplateExists(options.theme, options.template);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

await gatherOptions(shopId, options, themeProvided, templateProvided);
await writeShop(shopId, options);
