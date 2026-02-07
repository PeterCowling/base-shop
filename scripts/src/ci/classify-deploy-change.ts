import { readFileSync } from "node:fs";

import {
  DEPLOY_ONLY_EXACT_PATHS,
  DEPLOY_ONLY_PATH_PREFIXES,
  RUNTIME_PATH_PREFIXES,
} from "./classifier-fixtures";

export type DeployChangeClassification = {
  isDeployOnly: boolean;
  uncertain: boolean;
  reason:
    | "deploy_only_paths"
    | "runtime_path_detected"
    | "unknown_path_detected"
    | "empty_path_set";
  deployPaths: string[];
  runtimePaths: string[];
  unknownPaths: string[];
};

function normalizePath(rawPath: string): string {
  return rawPath.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function isDeployOnlyPath(path: string): boolean {
  if (DEPLOY_ONLY_EXACT_PATHS.has(path)) {
    return true;
  }

  return DEPLOY_ONLY_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isRuntimePath(path: string): boolean {
  return RUNTIME_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function classifyDeployChange(paths: readonly string[]): DeployChangeClassification {
  const normalizedPaths = paths.map(normalizePath).filter(Boolean);

  if (normalizedPaths.length === 0) {
    return {
      isDeployOnly: false,
      uncertain: true,
      reason: "empty_path_set",
      deployPaths: [],
      runtimePaths: [],
      unknownPaths: [],
    };
  }

  const deployPaths: string[] = [];
  const runtimePaths: string[] = [];
  const unknownPaths: string[] = [];

  for (const path of normalizedPaths) {
    if (isDeployOnlyPath(path)) {
      deployPaths.push(path);
      continue;
    }

    if (isRuntimePath(path)) {
      runtimePaths.push(path);
      continue;
    }

    unknownPaths.push(path);
  }

  if (runtimePaths.length > 0) {
    return {
      isDeployOnly: false,
      uncertain: false,
      reason: "runtime_path_detected",
      deployPaths,
      runtimePaths,
      unknownPaths,
    };
  }

  if (unknownPaths.length > 0) {
    return {
      isDeployOnly: false,
      uncertain: true,
      reason: "unknown_path_detected",
      deployPaths,
      runtimePaths,
      unknownPaths,
    };
  }

  return {
    isDeployOnly: true,
    uncertain: false,
    reason: "deploy_only_paths",
    deployPaths,
    runtimePaths,
    unknownPaths,
  };
}

function parseArgs(argv: string[]): string[] {
  const paths: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;

    if (arg === "--path") {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error("Missing value for --path");
      }
      paths.push(next);
      index += 1;
      continue;
    }

    if (arg === "--paths-file") {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error("Missing value for --paths-file");
      }

      const filePaths = readFileSync(next, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      paths.push(...filePaths);
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  pnpm --filter scripts run classify-deploy-change -- --path <path> [--path <path>]
  pnpm --filter scripts run classify-deploy-change -- --paths-file <file>
  pnpm --filter scripts run classify-deploy-change -- <path> [<path>]
`);
      process.exit(0);
    }

    paths.push(arg);
  }

  return paths;
}

function main(): void {
  const classification = classifyDeployChange(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(classification, null, 2));
}

if (process.argv[1]?.includes("classify-deploy-change")) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[classify-deploy-change] ${message}`);
    process.exitCode = 1;
  }
}
