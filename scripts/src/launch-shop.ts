// scripts/src/launch-shop.ts
/**
 * CLI entry point for the launch-shop orchestrator.
 *
 * Usage:
 *   pnpm launch-shop --config <file> [--env-file <file> | --vault-cmd <cmd>]
 *                    [--mode preview|production] [--validate | --dry-run]
 *                    [--force] [--allow-dirty-git]
 */
import { parseLaunchArgs } from "./launch-shop/cli/parseLaunchArgs";
import { launchShop } from "./launchShop";
import { ensureRuntime } from "./runtime";

ensureRuntime();

async function main(): Promise<void> {
  const options = parseLaunchArgs(process.argv.slice(2));

  try {
    const result = await launchShop(options);

    if (result.success) {
      process.exit(0);
    } else {
      console.error("\n=== Launch Failed ===");
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

main();
