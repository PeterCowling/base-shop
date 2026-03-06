import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import path from "path";

import { checkBaselinesFreshness } from "./baselines/baselines-freshness";
import type { McpPreflightOptions, McpPreflightProfile } from "./mcp-preflight-config";
import { isTruthyFlag, resolveMcpPreflightConfig } from "./mcp-preflight-config";

type McpPreflightCode =
  | "MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING"
  | "MCP_PREFLIGHT_LOCAL_SETTINGS_INVALID"
  | "MCP_PREFLIGHT_REGISTRATION_MISSING"
  | "MCP_PREFLIGHT_ENV_REGISTRATION_MISSING"
  | "MCP_PREFLIGHT_TOOL_FILE_MISSING"
  | "MCP_PREFLIGHT_TOOL_METADATA_MISSING"
  | "MCP_PREFLIGHT_TOOL_REGISTRY_DRIFT"
  | "MCP_PREFLIGHT_ARTIFACTS_MISSING"
  | "MCP_PREFLIGHT_ARTIFACT_STALE"
  | "MCP_PREFLIGHT_BASELINE_CONTENT_STALE"
  | "MCP_PREFLIGHT_INTERNAL";

export interface McpPreflightIssue {
  code: McpPreflightCode;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface McpPreflightCheck {
  id: "registration" | "tool-metadata" | "artifact-freshness" | "baseline-content-freshness";
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface McpPreflightResult {
  ok: boolean;
  profile: McpPreflightProfile;
  errors: McpPreflightIssue[];
  warnings: McpPreflightIssue[];
  checks: McpPreflightCheck[];
}

function toRelative(repoRoot: string, absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
}

function extractToolNamesFromDefinitions(source: string, prefix: "bos_" | "loop_"): Set<string> {
  const names = new Set<string>();
  const regex = /name:\s*"([a-z0-9_]+)"/g;

  while (true) {
    const match = regex.exec(source);
    if (!match) {
      break;
    }
    if (match[1].startsWith(prefix)) {
      names.add(match[1]);
    }
  }

  return names;
}

function extractPolicyKeys(source: string, mapName: string, prefix: "bos_" | "loop_"): Set<string> {
  const startToken = `export const ${mapName} = {`;
  const startIndex = source.indexOf(startToken);
  if (startIndex === -1) {
    return new Set<string>();
  }

  const blockStart = startIndex + startToken.length;
  const blockEnd = source.indexOf("} as const;", blockStart);
  const block = blockEnd === -1 ? source.slice(blockStart) : source.slice(blockStart, blockEnd);
  const keys = new Set<string>();
  const keyRegex = /^\s*([a-z0-9_]+)\s*:\s*\{/gm;

  while (true) {
    const match = keyRegex.exec(block);
    if (!match) {
      break;
    }
    if (match[1].startsWith(prefix)) {
      keys.add(match[1]);
    }
  }

  return keys;
}

function walkArtifactFiles(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  const files: string[] = [];
  const pending = [rootDir];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolute);
        continue;
      }
      if (entry.isFile()) {
        files.push(absolute);
      }
    }
  }

  return files;
}

function runRegistrationCheck(
  profile: McpPreflightProfile,
  settingsPath: string,
  mcpServerName: string,
  ciDeployedRegistrationFlag: string
): { errors: McpPreflightIssue[]; checks: McpPreflightCheck[] } {
  const errors: McpPreflightIssue[] = [];
  const checks: McpPreflightCheck[] = [];

  if (profile === "local") {
    if (!existsSync(settingsPath)) {
      errors.push({
        code: "MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING",
        message: "Local profile requires .claude/settings.json to exist.",
        path: settingsPath,
      });
      checks.push({
        id: "registration",
        status: "fail",
        message: "Local MCP registration could not be checked because settings file is missing.",
      });
      return { errors, checks };
    }

    try {
      const parsed = JSON.parse(readFileSync(settingsPath, "utf-8")) as Record<string, unknown>;
      const mcpServers = parsed.mcpServers as Record<string, unknown> | undefined;
      const serverConfig = mcpServers?.[mcpServerName] as Record<string, unknown> | undefined;

      if (!serverConfig) {
        errors.push({
          code: "MCP_PREFLIGHT_REGISTRATION_MISSING",
          message: `Missing mcpServers.${mcpServerName} in local settings.`,
          path: settingsPath,
        });
        checks.push({
          id: "registration",
          status: "fail",
          message: `mcpServers.${mcpServerName} is not configured in local settings.`,
        });
        return { errors, checks };
      }

      const command = serverConfig.command;
      if (typeof command !== "string" || command.length === 0) {
        errors.push({
          code: "MCP_PREFLIGHT_LOCAL_SETTINGS_INVALID",
          message: `mcpServers.${mcpServerName}.command must be a non-empty string.`,
          path: settingsPath,
        });
        checks.push({
          id: "registration",
          status: "fail",
          message: `mcpServers.${mcpServerName} exists but command is invalid.`,
        });
        return { errors, checks };
      }

      checks.push({
        id: "registration",
        status: "pass",
        message: `Found local MCP registration for ${mcpServerName}.`,
      });
      return { errors, checks };
    } catch (error) {
      errors.push({
        code: "MCP_PREFLIGHT_LOCAL_SETTINGS_INVALID",
        message: `Failed parsing local settings JSON: ${String(error)}`,
        path: settingsPath,
      });
      checks.push({
        id: "registration",
        status: "fail",
        message: "Local MCP settings file is not valid JSON.",
      });
      return { errors, checks };
    }
  }

  if (!isTruthyFlag(ciDeployedRegistrationFlag)) {
    errors.push({
      code: "MCP_PREFLIGHT_ENV_REGISTRATION_MISSING",
      message:
        "CI/deployed profile requires MCP_STARTUP_LOOP_SERVER_REGISTERED=true (or 1/yes).",
      details: {
        profile,
        receivedValue: ciDeployedRegistrationFlag || null,
      },
    });
    checks.push({
      id: "registration",
      status: "fail",
      message:
        "CI/deployed registration signal missing; set MCP_STARTUP_LOOP_SERVER_REGISTERED=true.",
    });
    return { errors, checks };
  }

  checks.push({
    id: "registration",
    status: "pass",
    message: `CI/deployed registration signal present for profile ${profile}.`,
  });
  return { errors, checks };
}

function runToolMetadataCheck(repoRoot: string): { errors: McpPreflightIssue[]; checks: McpPreflightCheck[] } {
  const errors: McpPreflightIssue[] = [];
  const checks: McpPreflightCheck[] = [];

  const bosPath = path.join(repoRoot, "packages/mcp-server/src/tools/bos.ts");
  const loopPath = path.join(repoRoot, "packages/mcp-server/src/tools/loop.ts");
  const indexPath = path.join(repoRoot, "packages/mcp-server/src/tools/index.ts");

  const requiredFiles = [bosPath, loopPath, indexPath];
  for (const requiredFile of requiredFiles) {
    if (!existsSync(requiredFile)) {
      errors.push({
        code: "MCP_PREFLIGHT_TOOL_FILE_MISSING",
        message: "Required MCP startup-loop tool file is missing.",
        path: requiredFile,
      });
    }
  }

  if (errors.length > 0) {
    checks.push({
      id: "tool-metadata",
      status: "fail",
      message: "Startup-loop MCP tool files are missing.",
    });
    return { errors, checks };
  }

  const bosSource = readFileSync(bosPath, "utf-8");
  const loopSource = readFileSync(loopPath, "utf-8");
  const indexSource = readFileSync(indexPath, "utf-8");

  const bosToolNames = extractToolNamesFromDefinitions(bosSource, "bos_");
  const loopToolNames = extractToolNamesFromDefinitions(loopSource, "loop_");
  const bosPolicyNames = extractPolicyKeys(bosSource, "bosToolPoliciesRaw", "bos_");
  const loopPolicyNames = extractPolicyKeys(loopSource, "loopToolPoliciesRaw", "loop_");

  const missingBosPolicies = [...bosToolNames].filter((name) => !bosPolicyNames.has(name));
  const missingLoopPolicies = [...loopToolNames].filter((name) => !loopPolicyNames.has(name));

  if (missingBosPolicies.length > 0 || missingLoopPolicies.length > 0) {
    errors.push({
      code: "MCP_PREFLIGHT_TOOL_METADATA_MISSING",
      message: "Startup-loop tools are missing policy metadata definitions.",
      details: {
        missingBosPolicies,
        missingLoopPolicies,
      },
    });
  }

  if (
    !indexSource.includes("...bosToolPoliciesRaw") ||
    !indexSource.includes("...loopToolPoliciesRaw") ||
    !indexSource.includes("...bosTools") ||
    !indexSource.includes("...loopTools")
  ) {
    errors.push({
      code: "MCP_PREFLIGHT_TOOL_REGISTRY_DRIFT",
      message:
        "Tool registry drift detected in tools/index.ts (startup-loop tools/policies not fully registered).",
      path: indexPath,
    });
  }

  checks.push({
    id: "tool-metadata",
    status: errors.length > 0 ? "fail" : "pass",
    message:
      errors.length > 0
        ? "Startup-loop tool metadata check failed."
        : "Startup-loop tool metadata and registry wiring are complete.",
  });
  return { errors, checks };
}

function runArtifactFreshnessCheck(params: {
  startupLoopArtifactRoot: string;
  staleThresholdSeconds: number;
  nowMs: number;
  repoRoot: string;
}): { warnings: McpPreflightIssue[]; checks: McpPreflightCheck[] } {
  const warnings: McpPreflightIssue[] = [];
  const checks: McpPreflightCheck[] = [];

  const artifactRoot = path.join(
    params.startupLoopArtifactRoot,
    "docs/business-os/startup-baselines"
  );

  const candidateFiles = walkArtifactFiles(artifactRoot).filter((absolutePath) => {
    const fileName = path.basename(absolutePath);
    return (
      fileName === "baseline.manifest.json" ||
      fileName === "learning-ledger.jsonl" ||
      fileName === "metrics.jsonl"
    );
  });

  if (candidateFiles.length === 0) {
    warnings.push({
      code: "MCP_PREFLIGHT_ARTIFACTS_MISSING",
      message: "No startup-loop artifacts found for freshness evaluation.",
      path: toRelative(params.repoRoot, artifactRoot),
    });
    checks.push({
      id: "artifact-freshness",
      status: "warn",
      message: "No startup-loop artifacts found; freshness check skipped.",
    });
    return { warnings, checks };
  }

  for (const filePath of candidateFiles) {
    const mtimeMs = statSync(filePath).mtimeMs;
    const ageSeconds = Math.max(0, Math.floor((params.nowMs - mtimeMs) / 1000));
    if (ageSeconds > params.staleThresholdSeconds) {
      warnings.push({
        code: "MCP_PREFLIGHT_ARTIFACT_STALE",
        message: `Artifact is stale (${ageSeconds}s old, threshold ${params.staleThresholdSeconds}s).`,
        path: toRelative(params.repoRoot, filePath),
        details: {
          ageSeconds,
          staleThresholdSeconds: params.staleThresholdSeconds,
        },
      });
    }
  }

  checks.push({
    id: "artifact-freshness",
    status: warnings.length > 0 ? "warn" : "pass",
    message:
      warnings.length > 0
        ? "Startup-loop artifacts evaluated; stale files detected."
        : "Startup-loop artifact freshness is within threshold.",
  });

  return { warnings, checks };
}

const BASELINE_CONTENT_THRESHOLD_SECONDS = 60 * 60 * 24 * 90; // 90 days

function runBaselineContentFreshnessCheck(params: {
  startupLoopArtifactRoot: string;
  nowMs: number;
  repoRoot: string;
  gitDateFn?: (filePath: string) => string | null;
}): { warnings: McpPreflightIssue[]; checks: McpPreflightCheck[] } {
  const warnings: McpPreflightIssue[] = [];

  const baselinesRoot = path.join(
    params.startupLoopArtifactRoot,
    "docs/business-os/startup-baselines"
  );

  const results = checkBaselinesFreshness({
    baselinesRoot,
    thresholdSeconds: BASELINE_CONTENT_THRESHOLD_SECONDS,
    nowMs: params.nowMs,
    gitDateFn: params.gitDateFn,
  });

  if (results.length === 0) {
    return {
      warnings,
      checks: [
        {
          id: "baseline-content-freshness",
          status: "pass",
          message: "No standing content files found in startup-baselines.",
        },
      ],
    };
  }

  const staleOrWarning = results.filter(
    (r) => r.status === "stale" || r.status === "warning"
  );

  for (const result of staleOrWarning) {
    const ageLabel =
      result.ageSeconds !== null
        ? `${result.ageSeconds}s old`
        : "unknown age";
    warnings.push({
      code: "MCP_PREFLIGHT_BASELINE_CONTENT_STALE",
      message: `Standing content is ${result.status} (${ageLabel}, threshold ${BASELINE_CONTENT_THRESHOLD_SECONDS}s).`,
      path: result.file,
      details: {
        ageSeconds: result.ageSeconds,
        thresholdSeconds: BASELINE_CONTENT_THRESHOLD_SECONDS,
        source: result.source,
        status: result.status,
      },
    });
  }

  return {
    warnings,
    checks: [
      {
        id: "baseline-content-freshness",
        status: warnings.length > 0 ? "warn" : "pass",
        message:
          warnings.length > 0
            ? `Standing content freshness: ${staleOrWarning.length} file(s) need attention.`
            : "Standing content freshness is within threshold.",
      },
    ],
  };
}

export function runMcpPreflight(
  options: McpPreflightOptions = {},
  env: NodeJS.ProcessEnv = process.env
): McpPreflightResult {
  try {
    const config = resolveMcpPreflightConfig(options, env);
    const registration = runRegistrationCheck(
      config.profile,
      config.localSettingsPath,
      config.mcpServerName,
      config.ciDeployedRegistrationFlag
    );
    const metadata = runToolMetadataCheck(config.repoRoot);
    const freshness = runArtifactFreshnessCheck({
      startupLoopArtifactRoot: config.startupLoopArtifactRoot,
      staleThresholdSeconds: config.staleThresholdSeconds,
      nowMs: Date.now(),
      repoRoot: config.repoRoot,
    });
    const baselineContent = runBaselineContentFreshnessCheck({
      startupLoopArtifactRoot: config.startupLoopArtifactRoot,
      nowMs: Date.now(),
      repoRoot: config.repoRoot,
    });

    const errors = [...registration.errors, ...metadata.errors];
    const warnings = [...freshness.warnings, ...baselineContent.warnings];
    const checks = [...registration.checks, ...metadata.checks, ...freshness.checks, ...baselineContent.checks];

    return {
      ok: errors.length === 0,
      profile: config.profile,
      errors,
      warnings,
      checks,
    };
  } catch (error) {
    return {
      ok: false,
      profile: options.profile ?? "local",
      errors: [
        {
          code: "MCP_PREFLIGHT_INTERNAL",
          message: `Unexpected preflight failure: ${String(error)}`,
        },
      ],
      warnings: [],
      checks: [
        {
          id: "registration",
          status: "fail",
          message: "Preflight aborted due to internal error.",
        },
      ],
    };
  }
}

type CliOptions = McpPreflightOptions & {
  asJson: boolean;
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { asJson: false };

  const consumeValue = (index: number, flag: string): string => {
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${flag}`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    }

    if (arg === "--profile") {
      const raw = consumeValue(index, arg);
      if (raw !== "local" && raw !== "ci" && raw !== "deployed") {
        throw new Error(`Invalid --profile value: ${raw}`);
      }
      options.profile = raw;
      index += 1;
      continue;
    }

    if (arg === "--repo-root") {
      options.repoRoot = consumeValue(index, arg);
      index += 1;
      continue;
    }

    if (arg === "--json") {
      options.asJson = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  pnpm exec tsx scripts/src/startup-loop/mcp-preflight.ts --profile local
  pnpm exec tsx scripts/src/startup-loop/mcp-preflight.ts --profile ci --json
  pnpm exec tsx scripts/src/startup-loop/mcp-preflight.ts --repo-root /path/to/repo
`);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

const MCP_PREFLIGHT_RECOVERY: Record<McpPreflightCode, string> = {
  MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING:
    "Next: claude mcp add --scope user brikette node /path/to/dist/index.js | retry-allowed after fix | Do not: look in .claude/settings.json (ignored by Claude Code 2.1.49+)",
  MCP_PREFLIGHT_LOCAL_SETTINGS_INVALID:
    "Next: inspect with `cat ~/.claude.json | jq .mcpServers` then re-run claude mcp add | retry-allowed after fix | Do not: edit .claude/settings.json directly",
  MCP_PREFLIGHT_REGISTRATION_MISSING:
    "Next: claude mcp add --scope user brikette node packages/mcp-server/dist/index.js | retry-allowed after registration | Do not: set MCP_STARTUP_LOOP_SERVER_REGISTERED=true without actual registration",
  MCP_PREFLIGHT_ENV_REGISTRATION_MISSING:
    "Next: set MCP_STARTUP_LOOP_SERVER_REGISTERED=true in CI environment after deploying MCP server | retry-allowed after env var set | Do not: set the flag without deploying the server",
  MCP_PREFLIGHT_TOOL_FILE_MISSING:
    "Next: pnpm --filter @packages/mcp-server build | retry-allowed after build | Do not: create the file manually (it is generated)",
  MCP_PREFLIGHT_TOOL_METADATA_MISSING:
    "Next: add missing policy metadata to the tool file, then pnpm --filter @packages/mcp-server build | retry-allowed after fix+build | Do not: skip the build step after editing",
  MCP_PREFLIGHT_TOOL_REGISTRY_DRIFT:
    "Next: ensure tools/index.ts spreads ...bosTools, ...loopTools, ...bosToolPoliciesRaw, ...loopToolPoliciesRaw, then rebuild | retry-allowed after fix | Do not: add tools directly to index.ts without the spread pattern",
  MCP_PREFLIGHT_ARTIFACTS_MISSING:
    "Next: run startup-loop baselines refresh to generate artifact files | retry-allowed (warn only) | Do not: create baseline files manually",
  MCP_PREFLIGHT_ARTIFACT_STALE:
    "Next: pnpm --filter scripts startup-loop:refresh | retry-allowed (warn only) | Do not: update timestamps without refreshing content",
  MCP_PREFLIGHT_BASELINE_CONTENT_STALE:
    "Next: update standing content in startup-baselines and commit | retry-allowed (warn only) | Do not: update only the file timestamp without updating actual content",
  MCP_PREFLIGHT_INTERNAL:
    "Next: inspect the error details above and surface to operator if cause is unclear | escalate-now | Do not: retry without understanding the root cause",
};

function printHumanResult(result: McpPreflightResult): void {
  if (result.ok) {
    console.log(`[mcp-preflight] PASS (${result.profile})`);
  } else {
    console.error(`[mcp-preflight] FAIL (${result.profile})`);
  }

  for (const check of result.checks) {
    const prefix = check.status.toUpperCase();
    const out = check.status === "fail" ? console.error : console.log;
    out(`- [${prefix}] ${check.id}: ${check.message}`);
  }

  for (const issue of result.errors) {
    const location = issue.path ? ` (${issue.path})` : "";
    console.error(`- [${issue.code}] ${issue.message}${location}`);
    const recovery = MCP_PREFLIGHT_RECOVERY[issue.code];
    if (recovery) {
      console.error(`  → ${recovery}`);
    }
  }

  for (const issue of result.warnings) {
    const location = issue.path ? ` (${issue.path})` : "";
    console.log(`- [${issue.code}] ${issue.message}${location}`);
    const recovery = MCP_PREFLIGHT_RECOVERY[issue.code];
    if (recovery) {
      console.log(`  → ${recovery}`);
    }
  }
}

function main(): void {
  const options = parseCliArgs(process.argv.slice(2));
  const result = runMcpPreflight(options);

  if (options.asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanResult(result);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1]?.includes("mcp-preflight")) {
  main();
}
