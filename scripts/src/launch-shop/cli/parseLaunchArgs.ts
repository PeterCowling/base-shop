// scripts/src/launch-shop/cli/parseLaunchArgs.ts
/**
 * CLI argument parser for launch-shop.
 *
 * LAUNCH-07: Added --resume and --fresh flags for idempotent execution.
 */
import type { LaunchOptions } from "../types";

function printUsage(): void {
  console.error("Usage: pnpm launch-shop --config <file> [options]");
  console.error("");
  console.error("Options:");
  console.error("  --config <file>      Launch config JSON file (required)");
  console.error("  --env-file <file>    Secrets env file");
  console.error("  --vault-cmd <cmd>    Vault command for secrets");
  console.error(
    "  --mode <mode>        preview or production (default: preview)"
  );
  console.error("  --validate           Validate only, no side effects");
  console.error("  --dry-run            Local operations only, no deploy");
  console.error("  --force              Overwrite existing shop");
  console.error("  --allow-dirty-git    Allow dirty git working tree");
  console.error("");
  console.error("Resume/Idempotency (LAUNCH-07):");
  console.error("  --resume             Resume from last successful step");
  console.error("  --fresh              Start over, ignoring existing state");
  console.error("");
  console.error("  --help               Show this help message");
  console.error("");
  console.error("Examples:");
  console.error(
    "  pnpm launch-shop --config profiles/shops/acme-sale.json --validate"
  );
  console.error(
    "  pnpm launch-shop --config profiles/shops/acme-sale.json --env-file profiles/shops/acme-sale.env --dry-run"
  );
  console.error(
    "  pnpm launch-shop --config profiles/shops/acme-sale.json --env-file profiles/shops/acme-sale.env --mode production"
  );
  console.error("");
  console.error("Resume examples:");
  console.error(
    "  pnpm launch-shop --config profiles/shops/acme-sale.json --resume"
  );
  console.error(
    "  pnpm launch-shop --config profiles/shops/acme-sale.json --fresh"
  );
}

function getArgValue(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= argv.length) {
    return undefined;
  }
  return argv[idx + 1];
}

export function parseLaunchArgs(argv: string[]): LaunchOptions {
  // Handle --help
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  // --config is required
  const configPath = getArgValue(argv, "--config");
  if (!configPath) {
    console.error("Error: --config <file> is required\n");
    printUsage();
    process.exit(1);
  }

  const envFilePath = getArgValue(argv, "--env-file");
  const vaultCmd = getArgValue(argv, "--vault-cmd");
  const modeArg = getArgValue(argv, "--mode");

  // Validate --mode
  let mode: "preview" | "production" = "preview";
  if (modeArg) {
    if (modeArg !== "preview" && modeArg !== "production") {
      console.error(`Error: --mode must be "preview" or "production"\n`);
      printUsage();
      process.exit(1);
    }
    mode = modeArg;
  }

  // --validate and --dry-run are mutually exclusive
  const validate = argv.includes("--validate");
  const dryRun = argv.includes("--dry-run");

  if (validate && dryRun) {
    console.error("Error: --validate and --dry-run are mutually exclusive\n");
    printUsage();
    process.exit(1);
  }

  // LAUNCH-07: Resume and fresh flags
  const resume = argv.includes("--resume");
  const fresh = argv.includes("--fresh");

  if (resume && fresh) {
    console.error("Error: --resume and --fresh are mutually exclusive\n");
    printUsage();
    process.exit(1);
  }

  return {
    configPath,
    envFilePath,
    vaultCmd,
    mode,
    validate,
    dryRun,
    force: argv.includes("--force"),
    allowDirtyGit: argv.includes("--allow-dirty-git"),
    resume,
    fresh,
  };
}
