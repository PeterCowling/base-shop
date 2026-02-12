import { readFileSync } from "node:fs";

import { FILTER_CONFIGS, type FilterConfig } from "./filter-config";

function normalizePath(rawPath: string): string {
  return rawPath.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Simple glob matcher that handles the four pattern types used in our
 * CI filter configs. Zero external dependencies.
 *
 * Supported patterns:
 * - `dir/**`            → prefix match (file starts with `dir/`)
 * - `exact/file.ext`    → exact match (no wildcards)
 * - `prefix*suffix`     → simple wildcard (one `*`)
 * - `** /\*`            → match everything
 */
function matchGlob(file: string, pattern: string): boolean {
  if (pattern === "**/*") return true;

  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return file === prefix || file.startsWith(prefix + "/");
  }

  if (!pattern.includes("*")) return file === pattern;

  // Simple wildcard: "lighthouserc*.json" → prefix + * + suffix
  const starIdx = pattern.indexOf("*");
  const prefix = pattern.slice(0, starIdx);
  const suffix = pattern.slice(starIdx + 1);
  return (
    file.startsWith(prefix) &&
    file.endsWith(suffix) &&
    file.length >= prefix.length + suffix.length
  );
}

/**
 * Classify changed files against a set of filter rules.
 *
 * For each filter, returns true if ANY changed file matches at least one
 * include pattern and does NOT match any exclude pattern.
 *
 * This reproduces the semantics of dorny/paths-filter@v3.
 */
export function classifyPaths(
  changedFiles: readonly string[],
  config: FilterConfig,
): Record<string, boolean> {
  const normalized = changedFiles.map(normalizePath).filter(Boolean);
  const result: Record<string, boolean> = {};

  for (const [filterName, rule] of Object.entries(config)) {
    result[filterName] = normalized.some((file) => {
      const included = rule.include.some((pattern) => matchGlob(file, pattern));
      if (!included) return false;

      if (rule.exclude.length === 0) return true;

      const excluded = rule.exclude.some((pattern) => matchGlob(file, pattern));
      return !excluded;
    });
  }

  return result;
}

// --- CLI ---

type CliFormat = "json" | "outputs";

type ParsedArgs = {
  paths: string[];
  configName: string;
  format: CliFormat;
};

function parseArgs(argv: string[]): ParsedArgs {
  const paths: string[] = [];
  let configName = "";
  let format: CliFormat = "json";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;

    if (arg === "--path") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --path");
      paths.push(next);
      i += 1;
      continue;
    }

    if (arg === "--paths-file") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --paths-file");
      const filePaths = readFileSync(next, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      paths.push(...filePaths);
      i += 1;
      continue;
    }

    if (arg === "--config") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --config");
      configName = next;
      i += 1;
      continue;
    }

    if (arg === "--format") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --format");
      if (next !== "json" && next !== "outputs")
        throw new Error(`Invalid --format: ${next}`);
      format = next;
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/ci/path-classifier.cjs --config <name> --paths-file <file> [--format outputs]
  node scripts/ci/path-classifier.cjs --config <name> --path <file> [--path <file>]

Configs: ${Object.keys(FILTER_CONFIGS).join(", ")}
`);
      process.exit(0);
    }

    paths.push(arg);
  }

  if (!configName) throw new Error("Missing --config argument");

  return { paths, configName, format };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const config = FILTER_CONFIGS[args.configName];

  if (!config) {
    throw new Error(
      `Unknown config: ${args.configName}. Available: ${Object.keys(FILTER_CONFIGS).join(", ")}`,
    );
  }

  const results = classifyPaths(args.paths, config);

  if (args.format === "outputs") {
    for (const [key, value] of Object.entries(results)) {
      console.log(`${key}=${value}`);
    }
    return;
  }

  console.log(JSON.stringify(results, null, 2));
}

if (process.argv[1]?.includes("path-classifier")) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[path-classifier] ${message}`);
    process.exitCode = 1;
  }
}
