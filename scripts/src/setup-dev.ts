#!/usr/bin/env node
/**
 * Dev Environment Setup Script (LAUNCH-12)
 *
 * A unified, friendly entry point for new developers to set up their
 * local development environment. Orchestrates existing tools with
 * better UX, diagnostics, and guidance.
 *
 * Usage:
 *   pnpm setup-dev [--skip-install] [--skip-build] [--shop <id>] [--verbose]
 *
 * What it does:
 *   1. Validates runtime requirements (Node, pnpm, git)
 *   2. Checks/runs pnpm install
 *   3. Sets up git hooks
 *   4. Validates/creates environment files
 *   5. Runs initial build (optional)
 *   6. Offers to create a dev shop
 *   7. Prints next steps
 */
import { execSync, spawnSync } from "node:child_process";
import { copyFileSync,existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as readline from "node:readline";

// ============================================================
// Types
// ============================================================

interface SetupOptions {
  skipInstall: boolean;
  skipBuild: boolean;
  shopId?: string;
  verbose: boolean;
  nonInteractive: boolean;
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  fix?: string;
}

// ============================================================
// Utilities
// ============================================================

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function log(message: string): void {
  console.log(message);
}

function success(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function warn(message: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function error(message: string): void {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function header(title: string): void {
  console.log("");
  console.log(`${colors.bold}${title}${colors.reset}`);
  console.log("─".repeat(50));
}

function cmd(command: string): string {
  return `${colors.dim}$ ${command}${colors.reset}`;
}

function execQuiet(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true, output: output.trim() };
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string };
    return {
      success: false,
      output: err.stderr || err.stdout || "",
    };
  }
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = await prompt(`${question} ${hint} `);

  if (answer === "") {
    return defaultYes;
  }
  return answer.toLowerCase().startsWith("y");
}

// ============================================================
// Checks
// ============================================================

function checkNodeVersion(): CheckResult {
  const result = execQuiet("node --version");
  if (!result.success) {
    return {
      name: "Node.js",
      passed: false,
      message: "Node.js not found",
      fix: "Install Node.js 20+ from https://nodejs.org/",
    };
  }

  const version = result.output.replace("v", "");
  const major = parseInt(version.split(".")[0], 10);

  if (major < 20) {
    return {
      name: "Node.js",
      passed: false,
      message: `Node.js ${version} found, but 20+ required`,
      fix: "Upgrade Node.js to version 20 or later",
    };
  }

  return {
    name: "Node.js",
    passed: true,
    message: `Node.js ${version}`,
  };
}

function checkPnpmVersion(): CheckResult {
  const result = execQuiet("pnpm --version");
  if (!result.success) {
    return {
      name: "pnpm",
      passed: false,
      message: "pnpm not found",
      fix: "Install pnpm: npm install -g pnpm@10",
    };
  }

  const version = result.output;
  const major = parseInt(version.split(".")[0], 10);

  if (major < 10) {
    return {
      name: "pnpm",
      passed: false,
      message: `pnpm ${version} found, but 10+ required`,
      fix: "Upgrade pnpm: npm install -g pnpm@10",
    };
  }

  return {
    name: "pnpm",
    passed: true,
    message: `pnpm ${version}`,
  };
}

function checkGit(): CheckResult {
  const result = execQuiet("git --version");
  if (!result.success) {
    return {
      name: "Git",
      passed: false,
      message: "Git not found",
      fix: "Install Git from https://git-scm.com/",
    };
  }

  // Check if we're in a git repo
  const repoCheck = execQuiet("git rev-parse --git-dir");
  if (!repoCheck.success) {
    return {
      name: "Git",
      passed: false,
      message: "Not in a git repository",
      fix: "Run: git init",
    };
  }

  return {
    name: "Git",
    passed: true,
    message: result.output.replace("git version ", ""),
  };
}

function checkNodeModules(): CheckResult {
  if (!existsSync("node_modules")) {
    return {
      name: "Dependencies",
      passed: false,
      message: "node_modules not found",
      fix: "Run: pnpm install",
    };
  }

  // Check for a key dependency to ensure install completed
  if (!existsSync("node_modules/.pnpm")) {
    return {
      name: "Dependencies",
      passed: false,
      message: "Dependencies appear incomplete",
      fix: "Run: pnpm install",
    };
  }

  return {
    name: "Dependencies",
    passed: true,
    message: "Installed",
  };
}

function checkGitHooks(): CheckResult {
  const hookPath = ".git/hooks/pre-commit";
  if (!existsSync(hookPath)) {
    return {
      name: "Git Hooks",
      passed: false,
      message: "Pre-commit hook not installed",
      fix: "Run: pnpm prepare",
    };
  }

  // Check if it's a simple-git-hooks hook
  const hookContent = readFileSync(hookPath, "utf8");
  if (!hookContent.includes("simple-git-hooks") && !hookContent.includes("lint-staged")) {
    return {
      name: "Git Hooks",
      passed: false,
      message: "Git hooks may not be properly configured",
      fix: "Run: pnpm prepare",
    };
  }

  return {
    name: "Git Hooks",
    passed: true,
    message: "Configured",
  };
}

function checkEnvFile(): CheckResult {
  // Check for any .env file at root
  const envFiles = [".env", ".env.local", ".env.development"];
  const existingEnv = envFiles.find((f) => existsSync(f));

  if (existingEnv) {
    return {
      name: "Environment",
      passed: true,
      message: `${existingEnv} exists`,
    };
  }

  // Check for CMS env file
  if (existsSync(".env.cms.local")) {
    return {
      name: "Environment",
      passed: true,
      message: ".env.cms.local exists (CMS mode)",
    };
  }

  return {
    name: "Environment",
    passed: false,
    message: "No .env file found",
    fix: "Copy .env.template to .env and fill in values",
  };
}

function checkPrismaClient(): CheckResult {
  const prismaClientPath = "node_modules/.prisma/client";
  if (!existsSync(prismaClientPath)) {
    return {
      name: "Prisma Client",
      passed: false,
      message: "Prisma client not generated",
      fix: "Run: pnpm prisma:generate",
    };
  }

  return {
    name: "Prisma Client",
    passed: true,
    message: "Generated",
  };
}

// ============================================================
// Setup Steps
// ============================================================

async function runInstall(verbose: boolean): Promise<boolean> {
  info("Running pnpm install...");

  const result = spawnSync("pnpm", ["install"], {
    stdio: verbose ? "inherit" : "pipe",
    shell: true,
  });

  if (result.status !== 0) {
    error("pnpm install failed");
    if (!verbose && result.stderr) {
      console.log(result.stderr.toString());
    }
    return false;
  }

  success("Dependencies installed");
  return true;
}

async function runPrepare(verbose: boolean): Promise<boolean> {
  info("Setting up git hooks...");

  const result = spawnSync("pnpm", ["prepare"], {
    stdio: verbose ? "inherit" : "pipe",
    shell: true,
  });

  if (result.status !== 0) {
    warn("Git hooks setup had issues (non-fatal)");
    return true; // Non-fatal
  }

  success("Git hooks configured");
  return true;
}

async function runPrismaGenerate(verbose: boolean): Promise<boolean> {
  info("Generating Prisma client...");

  const result = spawnSync("pnpm", ["prisma:generate"], {
    stdio: verbose ? "inherit" : "pipe",
    shell: true,
  });

  if (result.status !== 0) {
    warn("Prisma generate had issues (may be fine if using JSON backend)");
    return true; // Non-fatal
  }

  success("Prisma client generated");
  return true;
}

async function runBuild(verbose: boolean): Promise<boolean> {
  info("Running initial build...");
  log(colors.dim + "  This may take a few minutes..." + colors.reset);

  const result = spawnSync("pnpm", ["build"], {
    stdio: verbose ? "inherit" : "pipe",
    shell: true,
  });

  if (result.status !== 0) {
    error("Build failed");
    if (!verbose) {
      log("Run with --verbose to see build output");
    }
    return false;
  }

  success("Build completed");
  return true;
}

async function setupEnvFile(nonInteractive: boolean): Promise<boolean> {
  if (existsSync(".env") || existsSync(".env.local")) {
    return true;
  }

  if (existsSync(".env.template")) {
    if (nonInteractive) {
      copyFileSync(".env.template", ".env");
      success("Created .env from template");
      warn("Review and update .env with your values");
      return true;
    }

    const shouldCopy = await confirm(
      "No .env file found. Create from .env.template?"
    );

    if (shouldCopy) {
      copyFileSync(".env.template", ".env");
      success("Created .env from template");
      warn("Review and update .env with your values");
      return true;
    }
  }

  warn("No .env file created. Some features may not work.");
  return true;
}

async function offerShopCreation(
  shopId: string | undefined,
  nonInteractive: boolean
): Promise<void> {
  // Check if any shop already exists
  const appsDir = "apps";
  if (existsSync(appsDir)) {
    const { readdirSync } = await import("node:fs");
    const shops = readdirSync(appsDir).filter((d) => d.startsWith("shop-"));
    if (shops.length > 0) {
      info(`Found existing shop(s): ${shops.join(", ")}`);
      return;
    }
  }

  if (nonInteractive && !shopId) {
    info("No shop created. Run 'pnpm quickstart-shop' to create one.");
    return;
  }

  if (shopId) {
    info(`Creating shop: ${shopId}`);
    const result = spawnSync(
      "pnpm",
      ["quickstart-shop", "--id", shopId, "--auto-env", "--presets"],
      {
        stdio: "inherit",
        shell: true,
      }
    );

    if (result.status === 0) {
      success(`Shop "${shopId}" created`);
    } else {
      warn(`Shop creation had issues. Try: pnpm quickstart-shop --id ${shopId}`);
    }
    return;
  }

  const shouldCreate = await confirm(
    "No shops found. Create a demo shop now?"
  );

  if (shouldCreate) {
    const id = (await prompt("Shop ID [demo]: ")) || "demo";
    info(`Creating shop: ${id}`);

    const result = spawnSync(
      "pnpm",
      ["quickstart-shop", "--id", id, "--auto-env", "--presets"],
      {
        stdio: "inherit",
        shell: true,
      }
    );

    if (result.status === 0) {
      success(`Shop "${id}" created`);
    } else {
      warn(`Shop creation had issues. Try: pnpm quickstart-shop --id ${id}`);
    }
  }
}

// ============================================================
// Main
// ============================================================

function parseArgs(args: string[]): SetupOptions {
  const options: SetupOptions = {
    skipInstall: false,
    skipBuild: false,
    shopId: undefined,
    verbose: false,
    nonInteractive: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--skip-install":
        options.skipInstall = true;
        break;
      case "--skip-build":
        options.skipBuild = true;
        break;
      case "--shop":
        options.shopId = args[++i];
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--non-interactive":
      case "-y":
        options.nonInteractive = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
${colors.bold}setup-dev${colors.reset} - Set up your local development environment

${colors.bold}USAGE${colors.reset}
  pnpm setup-dev [options]

${colors.bold}OPTIONS${colors.reset}
  --skip-install      Skip pnpm install
  --skip-build        Skip initial build
  --shop <id>         Create a shop with the given ID
  --verbose, -v       Show detailed output
  --non-interactive   Don't prompt for input
  --help, -h          Show this help

${colors.bold}EXAMPLES${colors.reset}
  pnpm setup-dev                      Interactive setup
  pnpm setup-dev --shop demo          Setup and create 'demo' shop
  pnpm setup-dev -y --skip-build      Quick non-interactive setup
`);
}

function printNextSteps(hasShop: boolean): void {
  header("Next Steps");

  if (hasShop) {
    log(`
1. Start the development server:
   ${cmd("pnpm dev")}

2. Open in browser:
   ${colors.blue}http://localhost:3000${colors.reset}

3. Open CMS:
   ${colors.blue}http://localhost:4000${colors.reset}
`);
  } else {
    log(`
1. Create your first shop:
   ${cmd("pnpm quickstart-shop --id myshop")}

2. Or start the CMS:
   ${cmd("pnpm --filter @apps/cms dev")}

3. See all available commands:
   ${cmd("pnpm run")}
`);
  }

  log(`${colors.dim}Documentation: docs/setup.md${colors.reset}`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  console.log("");
  console.log(
    `${colors.bold}${colors.blue}Base-Shop Development Setup${colors.reset}`
  );
  console.log("═".repeat(50));

  // Phase 1: Check prerequisites
  header("Checking Prerequisites");

  const checks: CheckResult[] = [
    checkNodeVersion(),
    checkPnpmVersion(),
    checkGit(),
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.passed) {
      success(`${check.name}: ${check.message}`);
    } else {
      error(`${check.name}: ${check.message}`);
      if (check.fix) {
        log(`   Fix: ${check.fix}`);
      }
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.log("");
    error("Prerequisites not met. Please fix the issues above and try again.");
    process.exit(1);
  }

  // Phase 2: Install dependencies
  header("Setting Up Dependencies");

  const depsCheck = checkNodeModules();
  if (!depsCheck.passed && !options.skipInstall) {
    const installed = await runInstall(options.verbose);
    if (!installed) {
      process.exit(1);
    }
  } else if (depsCheck.passed) {
    success("Dependencies: Already installed");
  } else {
    warn("Skipping install (--skip-install)");
  }

  // Phase 3: Git hooks
  const hooksCheck = checkGitHooks();
  if (!hooksCheck.passed) {
    await runPrepare(options.verbose);
  } else {
    success("Git hooks: Already configured");
  }

  // Phase 4: Environment file
  header("Environment Configuration");

  await setupEnvFile(options.nonInteractive);

  const envCheck = checkEnvFile();
  if (envCheck.passed) {
    success(`Environment: ${envCheck.message}`);
  } else {
    warn(`Environment: ${envCheck.message}`);
  }

  // Phase 5: Prisma client
  const prismaCheck = checkPrismaClient();
  if (!prismaCheck.passed) {
    await runPrismaGenerate(options.verbose);
  } else {
    success("Prisma client: Already generated");
  }

  // Phase 6: Build
  if (!options.skipBuild) {
    header("Building Packages");
    const built = await runBuild(options.verbose);
    if (!built) {
      warn("Build failed, but you can continue with development.");
    }
  } else {
    info("Skipping build (--skip-build)");
  }

  // Phase 7: Shop creation
  header("Shop Setup");
  await offerShopCreation(options.shopId, options.nonInteractive);

  // Phase 8: Summary
  const hasShop =
    existsSync("apps") &&
    require("node:fs")
      .readdirSync("apps")
      .some((d: string) => d.startsWith("shop-"));

  printNextSteps(hasShop);

  console.log("");
  success("Development environment setup complete!");
  console.log("");
}

main().catch((e) => {
  error(`Setup failed: ${e.message}`);
  process.exit(1);
});
