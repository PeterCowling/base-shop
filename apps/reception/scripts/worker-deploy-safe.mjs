#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const REQUIRED_FIREBASE_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
];

const REQUIRED_DEPLOY_ENV = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];

const PLACEHOLDER_PREFIXES = [
  "TODO_",
  "__REPLACE_ME__",
  "placeholder",
  "CHANGEME",
  "changeme",
  "xxx",
  "XXX",
  "your_",
  "YOUR_",
  "replace_",
  "REPLACE_",
];

const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);
const appDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(appDir, "../..");

const defaultAppEnvFile = path.join(appDir, ".env.local");
const defaultRootEnvFile = path.join(repoRoot, ".env.local");

const cli = parseCliArgs(process.argv.slice(2));

const envSources = [
  loadEnvFile(cli.rootEnvFile, "repo-root deploy env"),
  loadEnvFile(cli.appEnvFile, "reception app build env"),
];

const mergedEnv = buildMergedEnv(envSources);
const currentCommand = cli.skipDeploy
  ? "pnpm --filter @apps/reception build:worker"
  : "pnpm --filter @apps/reception deploy:worker:safe";

printIntro();
printEnvSources(envSources);

const firebaseFailures = validateRequiredEnv(REQUIRED_FIREBASE_ENV, mergedEnv);
if (firebaseFailures.length > 0) {
  failMissingEnv({
    title: "Missing reception build-time Firebase env",
    reason:
      "Reception Worker builds bake NEXT_PUBLIC_FIREBASE_* values into the client bundle. Building without them ships a broken login screen.",
    nextStep:
      "Update apps/reception/.env.local with the missing NEXT_PUBLIC_FIREBASE_* values from apps/reception/.env.example, then rerun the safe reception Worker command.",
    antiRetryList: [
      "pnpm --filter @apps/reception build:worker",
      "pnpm --filter @apps/reception deploy:worker:safe",
      "pnpm exec opennextjs-cloudflare build",
      "pnpm exec wrangler deploy",
    ],
    stopCondition:
      "After 1 retry with the same missing keys, stop and compare apps/reception/.env.local against apps/reception/.env.example and the CI secret set.",
    failures: firebaseFailures,
    command: currentCommand,
  });
}

if (!cli.skipDeploy) {
  const deployFailures = validateRequiredEnv(REQUIRED_DEPLOY_ENV, mergedEnv);
  if (deployFailures.length > 0) {
    failMissingEnv({
      title: "Missing Cloudflare deploy env",
      reason:
        "Wrangler deploys for reception require Cloudflare account auth. Without CLOUDFLARE_* values the deploy cannot authenticate.",
      nextStep:
        "Update .env.local at the repo root with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN, or export them in the current shell, then rerun the safe reception deploy command.",
      antiRetryList: [
        "pnpm --filter @apps/reception deploy:worker:safe",
        "pnpm exec wrangler deploy",
      ],
      stopCondition:
        "After 1 retry with the same missing Cloudflare vars, stop and verify the local deploy credentials source before retrying again.",
      failures: deployFailures,
      command: currentCommand,
    });
  }
}

printPlannedCommands(cli);

if (cli.dryRun) {
  console.info("");
  console.info("Dry run complete.");
  process.exit(0);
}

runCommand({
  label: "Build reception Worker bundle",
  command: "pnpm",
  args: ["run", "build:worker:raw"],
  nextStep: "Fix the build error above, then rerun the safe reception Worker command.",
  antiRetryList: [
    "pnpm exec wrangler deploy",
    "pnpm --filter @apps/reception deploy:worker:safe",
  ],
});

if (!cli.skipDeploy) {
  runCommand({
    label: "Deploy reception Worker",
    command: "pnpm",
    args: ["exec", "wrangler", "deploy"],
    nextStep:
      "Run pnpm exec wrangler whoami in apps/reception, fix the auth or Cloudflare config issue it reports, then rerun the safe reception deploy command.",
    antiRetryList: [
      "pnpm exec wrangler deploy",
      "pnpm --filter @apps/reception deploy:worker:safe",
    ],
  });
}

console.info("");
console.info(
  cli.skipDeploy ? "Reception Worker build completed." : "Reception Worker build and deploy completed."
);

function parseCliArgs(args) {
  const options = {
    dryRun: false,
    skipDeploy: false,
    appEnvFile: defaultAppEnvFile,
    rootEnvFile: defaultRootEnvFile,
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--skip-deploy") {
      options.skipDeploy = true;
      continue;
    }
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    if (arg.startsWith("--app-env-file=")) {
      options.appEnvFile = path.resolve(process.cwd(), arg.slice("--app-env-file=".length));
      continue;
    }
    if (arg.startsWith("--root-env-file=")) {
      options.rootEnvFile = path.resolve(process.cwd(), arg.slice("--root-env-file=".length));
      continue;
    }

    console.error(`Unknown argument: ${arg}`);
    printHelp();
    process.exit(2);
  }

  return options;
}

function printHelp() {
  console.info("Usage: node ./scripts/worker-deploy-safe.mjs [options]");
  console.info("");
  console.info("Options:");
  console.info("  --dry-run                 Validate env and print commands without running them");
  console.info("  --skip-deploy             Build the Worker bundle only");
  console.info("  --app-env-file=<path>     Override apps/reception/.env.local");
  console.info("  --root-env-file=<path>    Override repo-root .env.local");
}

function loadEnvFile(filePath, label) {
  if (!existsSync(filePath)) {
    return { label, path: filePath, found: false, env: {} };
  }

  return {
    label,
    path: filePath,
    found: true,
    env: dotenv.parse(readFileSync(filePath, "utf8")),
  };
}

function buildMergedEnv(sources) {
  return {
    ...sources[0].env,
    ...sources[1].env,
    ...process.env,
  };
}

function validateRequiredEnv(keys, env) {
  return keys.flatMap((key) => {
    const value = `${env[key] ?? ""}`.trim();
    if (value.length === 0) {
      return [{ key, status: "missing" }];
    }
    if (isPlaceholder(value)) {
      return [{ key, status: "placeholder" }];
    }
    return [];
  });
}

function isPlaceholder(value) {
  return PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function printIntro() {
  console.info("========================================");
  console.info("  Reception Worker Safe Release");
  console.info("========================================");
}

function printEnvSources(sources) {
  console.info("");
  console.info("Env sources:");
  for (const source of sources) {
    console.info(
      `- ${source.label}: ${source.found ? "found" : "missing"} (${toRepoRelative(source.path)})`
    );
  }
}

function printPlannedCommands(options) {
  console.info("");
  console.info("Planned commands:");
  console.info(`- pnpm run build:worker:raw (cwd: ${toRepoRelative(appDir)})`);
  if (!options.skipDeploy) {
    console.info(`- pnpm exec wrangler deploy (cwd: ${toRepoRelative(appDir)})`);
  }
}

function failMissingEnv({
  title,
  reason,
  nextStep,
  antiRetryList,
  stopCondition,
  failures,
  command,
}) {
  console.error("");
  console.error(`${title}`);
  console.error(`Failure reason: ${reason}`);
  console.error("Retry posture: retry-allowed");
  console.error(`Exact next step: ${nextStep}`);
  console.error(`Exact rerun command: ${command}`);
  console.error(`Anti-retry list: ${antiRetryList.join("; ")}`);
  console.error(`Escalation/stop condition: ${stopCondition}`);
  console.error("Invalid variables:");
  for (const failure of failures) {
    console.error(`- ${failure.key}: ${failure.status}`);
  }
  process.exit(1);
}

function runCommand({ label, command, args, nextStep, antiRetryList }) {
  console.info("");
  console.info(`${label}...`);

  const result = spawnSync(command, args, {
    cwd: appDir,
    env: mergedEnv,
    stdio: "inherit",
  });

  if (result.error) {
    console.error("");
    console.error(`${label} failed`);
    console.error(`Failure reason: Unable to execute ${command}: ${result.error.message}`);
    console.error("Retry posture: escalate-now");
    console.error(`Exact next step: Verify that ${command} is installed and available on PATH, then rerun ${currentCommand}`);
    console.error(`Anti-retry list: ${antiRetryList.join("; ")}`);
    console.error(
      "Escalation/stop condition: If the command binary is present and this error still occurs, stop local retries and inspect the local toolchain installation."
    );
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error("");
    console.error(`${label} failed`);
    console.error(`Failure reason: ${command} exited with status ${result.status}`);
    console.error("Retry posture: retry-allowed");
    console.error(`Exact next step: ${nextStep}`);
    console.error(`Exact rerun command: ${currentCommand}`);
    console.error(`Anti-retry list: ${antiRetryList.join("; ")}`);
    console.error(
      "Escalation/stop condition: After 1 retry with the same error output, stop and inspect the failing build/deploy trace before retrying again."
    );
    process.exit(result.status ?? 1);
  }
}

function toRepoRelative(targetPath) {
  const relative = path.relative(repoRoot, targetPath);
  return relative.length > 0 ? relative : ".";
}
