import path from "node:path";
import process from "node:process";
import { checkGlbBudgets } from "./budgets/checkGlbBudgets";

function parseArgs(args: string[]) {
  const options: {
    productId?: string;
    tier?: "mobile" | "desktop";
    strictMissing?: boolean;
  } = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--product" || arg === "--productId") {
      options.productId = args[i + 1];
      i += 1;
    } else if (arg === "--tier") {
      const next = args[i + 1];
      if (next === "mobile" || next === "desktop") {
        options.tier = next;
      }
      i += 1;
    } else if (arg === "--strict") {
      options.strictMissing = true;
    }
  }

  return options;
}

async function runBudgetsCheck(args: string[]) {
  const { productId, tier, strictMissing } = parseArgs(args);
  const repoRoot = path.resolve(process.cwd(), "../..");
  const results = await checkGlbBudgets({
    repoRoot,
    productId,
    tier,
    strictMissing,
  });

  if (!results.length) {
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] CLI output
    console.log("No products with budgets.json found.");
    return;
  }

  let hasFailures = false;
  for (const result of results) {
    const prefix = result.ok ? "OK" : "FAIL";
    console.log(`[${prefix}] ${result.productId} (${result.tier})`);
    for (const message of result.messages) {
      console.log(`  - ${message}`);
    }
    if (!result.ok) hasFailures = true;
  }

  if (hasFailures) {
    process.exitCode = 1;
  }
}

const [, , cmd, ...rest] = process.argv;

switch (cmd) {
  case "budgets:check":
    void runBudgetsCheck(rest);
    break;
  default:
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] CLI usage string
    console.log("Usage: pnpm --filter @acme/tools budgets:check [--product bag-001] [--tier mobile|desktop] [--strict]");
    process.exit(1);
}
