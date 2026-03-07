#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  XA_B_DEPLOY_HOOK_URL_ENV,
  XA_UPLOADER_REQUIRED_CF_SECRET_NAMES,
} from "../src/lib/uploaderRuntimeConfig";

const PLACEHOLDER_PREFIXES = [
  "TODO_",
  "REPLACE_",
  "CHANGEME",
  "placeholder",
  "your-",
  "your_",
];

type CliOptions = {
  env: string;
  syncDeployHookFromEnv: boolean;
  syncKvIdFromEnv: boolean;
  asJson: boolean;
};

type CommandResult = {
  status: number;
  stdout: string;
  stderr: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    env: "preview",
    syncDeployHookFromEnv: false,
    syncKvIdFromEnv: false,
    asJson: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") continue;

    if (arg === "--env") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --env");
      }
      options.env = value;
      index += 1;
      continue;
    }

    if (arg === "--sync-deploy-hook-from-env") {
      options.syncDeployHookFromEnv = true;
      continue;
    }

    if (arg === "--sync-kv-id-from-env") {
      options.syncKvIdFromEnv = true;
      continue;
    }

    if (arg === "--json") {
      options.asJson = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.info(`Usage:
  pnpm --filter @apps/xa-uploader run preflight:deploy -- --env preview
  pnpm --filter @apps/xa-uploader run preflight:deploy -- --env preview --sync-deploy-hook-from-env
  pnpm --filter @apps/xa-uploader run preflight:deploy -- --env preview --sync-kv-id-from-env
  pnpm --filter @apps/xa-uploader run preflight:deploy -- --env preview --json
`);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; input?: string; env?: NodeJS.ProcessEnv } = {},
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    input: options.input,
    encoding: "utf8",
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function sanitizeMessage(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function kvNamespaceIdEnvName(env: string): string {
  return env === "preview" ? "XA_UPLOADER_KV_NAMESPACE_ID_PREVIEW" : "XA_UPLOADER_KV_NAMESPACE_ID";
}

function validateKvNamespaceId(raw: string, envName: string): string | null {
  const value = raw.trim();
  if (!value) {
    return `${envName} is missing.`;
  }
  if (PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return `${envName} looks like a placeholder value.`;
  }
  if (!/^[0-9a-f]{32}$/i.test(value)) {
    return `${envName} must be a 32-character hexadecimal KV namespace id.`;
  }
  return null;
}

function kvBindingRegexForEnv(env: string): RegExp {
  if (env === "preview") {
    return /(\[\[env\.preview\.kv_namespaces\]\]\s*binding\s*=\s*"XA_UPLOADER_KV"\s*id\s*=\s*")[^"]*(")/m;
  }
  return /(\[\[kv_namespaces\]\]\s*binding\s*=\s*"XA_UPLOADER_KV"\s*id\s*=\s*")[^"]*(")/m;
}

function readConfiguredKvNamespaceId(params: { appDir: string; env: string }): string | null {
  const wranglerPath = path.join(params.appDir, "wrangler.toml");
  const wranglerRaw = fs.readFileSync(wranglerPath, "utf8");
  const match = wranglerRaw.match(kvBindingRegexForEnv(params.env));
  if (!match || typeof match[1] !== "string" || typeof match[2] !== "string") {
    return null;
  }
  const prefix = match[1];
  const suffix = match[2];
  const full = match[0];
  return full.slice(prefix.length, full.length - suffix.length).trim();
}

function syncKvNamespaceIdFromEnv(params: { appDir: string; env: string }): void {
  const envName = kvNamespaceIdEnvName(params.env);
  const raw = process.env[envName] ?? "";
  const validationError = validateKvNamespaceId(raw, envName);
  if (validationError) {
    throw new Error(validationError);
  }
  const kvId = raw.trim();

  const wranglerPath = path.join(params.appDir, "wrangler.toml");
  const wranglerRaw = fs.readFileSync(wranglerPath, "utf8");
  const regex = kvBindingRegexForEnv(params.env);
  if (!regex.test(wranglerRaw)) {
    throw new Error(`Could not locate XA_UPLOADER_KV binding block for env=${params.env} in wrangler.toml.`);
  }
  const next = wranglerRaw.replace(regex, `$1${kvId}$2`);
  fs.writeFileSync(wranglerPath, next, "utf8");
}

function assertKvNamespaceIdConfigured(params: { appDir: string; env: string }): void {
  const configured = readConfiguredKvNamespaceId(params);
  if (!configured) {
    throw new Error(`Missing XA_UPLOADER_KV namespace id in wrangler.toml for env=${params.env}.`);
  }
  const validationError = validateKvNamespaceId(configured, "wrangler.toml XA_UPLOADER_KV id");
  if (validationError) {
    throw new Error(validationError);
  }
}

function validateHookUrl(rawUrl: string): string | null {
  const value = rawUrl.trim();
  if (!value) {
    return `${XA_B_DEPLOY_HOOK_URL_ENV} is empty.`;
  }
  if (PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return `${XA_B_DEPLOY_HOOK_URL_ENV} looks like a placeholder value.`;
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return `${XA_B_DEPLOY_HOOK_URL_ENV} is not a valid URL.`;
  }
  if (parsed.protocol !== "https:") {
    return `${XA_B_DEPLOY_HOOK_URL_ENV} must use https://`;
  }
  if (!parsed.hostname) {
    return `${XA_B_DEPLOY_HOOK_URL_ENV} is missing hostname.`;
  }
  return null;
}

function listWorkerSecrets(params: { appDir: string; env: string }): Set<string> {
  const args = [
    "exec",
    "wrangler",
    "secret",
    "list",
    "--config",
    "wrangler.toml",
    "--format",
    "json",
  ];
  if (params.env) {
    args.push("--env", params.env);
  }
  const result = runCommand("pnpm", args, { cwd: params.appDir });
  if (result.status !== 0) {
    const message = sanitizeMessage(result.stderr || result.stdout) || "wrangler secret list failed";
    throw new Error(message);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout || "[]");
  } catch {
    throw new Error("wrangler secret list did not return valid JSON.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("wrangler secret list returned an unexpected payload shape.");
  }
  const names = new Set<string>();
  for (const entry of parsed) {
    if (typeof entry === "string" && entry.trim()) {
      names.add(entry.trim());
      continue;
    }
    if (
      entry &&
      typeof entry === "object" &&
      "name" in entry &&
      typeof entry.name === "string" &&
      entry.name.trim()
    ) {
      names.add(entry.name.trim());
    }
  }
  return names;
}

function syncDeployHookSecret(params: { appDir: string; env: string }): void {
  const hookUrl = (process.env[XA_B_DEPLOY_HOOK_URL_ENV] ?? "").trim();
  const validationError = validateHookUrl(hookUrl);
  if (validationError) {
    throw new Error(validationError);
  }

  const args = [
    "exec",
    "wrangler",
    "secret",
    "put",
    XA_B_DEPLOY_HOOK_URL_ENV,
    "--config",
    "wrangler.toml",
  ];
  if (params.env) {
    args.push("--env", params.env);
  }

  const result = runCommand("pnpm", args, { cwd: params.appDir, input: `${hookUrl}\n` });
  if (result.status !== 0) {
    const message = sanitizeMessage(result.stderr || result.stdout) || "wrangler secret put failed";
    throw new Error(message);
  }
}

function printHumanPass(env: string, syncedDeployHook: boolean): void {
  const syncNote = syncedDeployHook ? " (deploy hook secret synced)" : "";
  console.info(`[xa-uploader-preflight] PASS${syncNote}`);
  console.info(`[xa-uploader-preflight] env=${env}`);
  console.info(
    `[xa-uploader-preflight] verified secrets: ${XA_UPLOADER_REQUIRED_CF_SECRET_NAMES.join(", ")}`,
  );
}

function printHumanFail(errorOrMissingSecrets: Error | string[]): void {
  console.error("[xa-uploader-preflight] FAIL");
  if (errorOrMissingSecrets instanceof Error) {
    console.error(`- ${errorOrMissingSecrets.message}`);
    return;
  }
  for (const name of errorOrMissingSecrets) {
    console.error(`- missing secret: ${name}`);
  }
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const appDir = path.resolve(scriptDir, "..");

  try {
    let syncedDeployHook = false;
    let syncedKvNamespaceId = false;
    if (options.syncKvIdFromEnv) {
      syncKvNamespaceIdFromEnv({ appDir, env: options.env });
      syncedKvNamespaceId = true;
    }
    assertKvNamespaceIdConfigured({ appDir, env: options.env });

    if (options.syncDeployHookFromEnv) {
      syncDeployHookSecret({ appDir, env: options.env });
      syncedDeployHook = true;
    }

    const secretNames = listWorkerSecrets({ appDir, env: options.env });
    const missingSecrets = XA_UPLOADER_REQUIRED_CF_SECRET_NAMES.filter(
      (name) => !secretNames.has(name),
    );

    const payload = {
      ok: missingSecrets.length === 0,
      env: options.env,
      syncedDeployHook,
      syncedKvNamespaceId,
      kvNamespaceIdEnv: kvNamespaceIdEnvName(options.env),
      checkedSecrets: XA_UPLOADER_REQUIRED_CF_SECRET_NAMES,
      missingSecrets,
    };

    if (options.asJson) {
      console.info(JSON.stringify(payload, null, 2));
    } else if (payload.ok) {
      printHumanPass(options.env, syncedDeployHook);
    } else {
      printHumanFail(missingSecrets);
    }

    if (!payload.ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    const parsedError = error instanceof Error ? error : new Error(String(error));
    if (options.asJson) {
      console.info(
        JSON.stringify(
          {
            ok: false,
            env: options.env,
            error: parsedError.message,
          },
          null,
          2,
        ),
      );
    } else {
      printHumanFail(parsedError);
    }
    process.exitCode = 1;
  }
}

main();
