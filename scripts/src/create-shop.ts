// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
import { ensureTemplateExists } from "@acme/platform-core/createShop";

import { parseArgs } from "./createShop/parse";
import { gatherOptions } from "./createShop/prompts";
import { type Options as WriteOptions,writeShop } from "./createShop/write";
import { ensureRuntime } from "./runtime";
import { seedShop } from "./seedShop";

ensureRuntime();

const {
  shopId,
  options,
  themeProvided,
  templateProvided,
  seed,
} = parseArgs(process.argv.slice(2));
if (themeProvided || templateProvided) {
  try {
    ensureTemplateExists(options.theme as string, options.template as string);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

await gatherOptions(shopId, options, themeProvided, templateProvided);
await writeShop(shopId, options as WriteOptions);
if (seed) {
  seedShop(shopId);
}
