import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getShopAppSlug, getShopWorkflowName } from "@acme/platform-core/shops";

const rootDir = process.cwd();
const shopsDir = join(rootDir, "data", "shops");

if (!existsSync(shopsDir)) {
  console.error("Missing data/shops directory.");
  process.exit(1);
}

const shopIds = readdirSync(shopsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .sort();

const rows = shopIds.map((shopId) => {
  const appSlug = getShopAppSlug(shopId);
  const appDir = join(rootDir, "apps", appSlug);
  const workflowFile = join(rootDir, ".github", "workflows", getShopWorkflowName(shopId));

  return {
    shopId,
    appSlug,
    appDirExists: existsSync(appDir),
    workflowExists: existsSync(workflowFile),
  };
});

console.table(rows);
