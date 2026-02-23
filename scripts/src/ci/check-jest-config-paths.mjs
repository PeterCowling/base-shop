#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const USAGE = `Usage:
  node scripts/src/ci/check-jest-config-paths.mjs [options] [--paths <p1> <p2> ...]

Options:
  --repo-root <path>   Repo root. If omitted, uses: git rev-parse --show-toplevel
  --source <mode>      Where to read file contents from:
                       - fs (default): filesystem under --repo-root
                       - index: git index (staged), via "git show :<path>"
                       - ref:<sha>: git object, via "git show <sha>:<path>"
  --staged             Check staged paths (git diff --cached --name-only). Implies --source index.
  --all                Check all tracked relevant package.json files (git ls-files).
  --paths ...          Explicit repo-relative paths. If omitted, reads newline-delimited paths from stdin.
  -h, --help           Show this help.

Exit codes:
  0 - ok
  1 - policy violation found
  2 - usage / environment error
`;

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(2);
}

function git(repoRoot, args, { allowFail = false } = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.status !== 0) {
    if (allowFail) return null;
    const stderr = (result.stderr || "").trim();
    die(`ERROR: git ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`);
  }

  return (result.stdout || "").toString();
}

function resolveRepoRoot(cliRepoRoot) {
  if (cliRepoRoot) return path.resolve(cliRepoRoot);
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    die("ERROR: not in a git repo (or pass --repo-root).");
  }
  return (result.stdout || "").trim();
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function parseArgs(argv) {
  const out = {
    repoRoot: "",
    source: "fs",
    staged: false,
    all: false,
    paths: [],
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
      continue;
    }
    if (arg === "--repo-root") {
      out.repoRoot = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (arg === "--source") {
      out.source = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (arg === "--staged") {
      out.staged = true;
      continue;
    }
    if (arg === "--all") {
      out.all = true;
      continue;
    }
    if (arg === "--paths") {
      i += 1;
      while (i < argv.length && !argv[i].startsWith("--")) {
        out.paths.push(argv[i]);
        i += 1;
      }
      i -= 1;
      continue;
    }
    die(`ERROR: unknown arg: ${arg}\n\n${USAGE}`);
  }

  if (out.staged) out.source = "index";
  if (out.staged && out.all) {
    die(`ERROR: --staged and --all are mutually exclusive.\n\n${USAGE}`);
  }
  if (!out.source || (!["fs", "index"].includes(out.source) && !out.source.startsWith("ref:"))) {
    die(`ERROR: invalid --source "${out.source}"\n\n${USAGE}`);
  }

  return out;
}

function normalizeRelPath(inputPath) {
  return inputPath.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function isRelevantPath(relPath) {
  if (!relPath.endsWith("/package.json")) return false;
  if (relPath.startsWith("apps/")) return true;
  if (relPath.startsWith("packages/")) return true;
  return false;
}

function listCandidatePaths({ repoRoot, staged, all, explicitPaths }) {
  if (all) {
    return git(repoRoot, ["ls-files"]).split("\n").filter(Boolean);
  }
  if (staged) {
    return git(repoRoot, ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"])
      .split("\n")
      .filter(Boolean);
  }
  if (explicitPaths.length > 0) {
    return explicitPaths;
  }

  return readStdin()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readFileContent({ repoRoot, source, relPath }) {
  if (source === "fs") {
    const absPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(absPath)) return null;
    return fs.readFileSync(absPath, "utf8");
  }

  if (source === "index") {
    return git(repoRoot, ["show", `:${relPath}`], { allowFail: true });
  }

  if (source.startsWith("ref:")) {
    const ref = source.slice("ref:".length);
    if (!ref) return null;
    return git(repoRoot, ["show", `${ref}:${relPath}`], { allowFail: true });
  }

  return null;
}

function extractConfigValues(testScript) {
  const values = [];
  const configRegex = /(?:^|\s)--config(?:=|\s+)("([^"]+)"|'([^']+)'|([^\s"']+))/g;
  let match;

  while ((match = configRegex.exec(testScript)) !== null) {
    values.push(match[2] || match[3] || match[4] || "");
  }

  return values.filter(Boolean);
}

function isWorkspaceRootGovernedInvocation(testScript) {
  return /\bpnpm\s+-w\s+run\s+test:governed\b/.test(testScript);
}

function isDotRelativePath(configValue) {
  return configValue === "." || configValue === ".." || configValue.startsWith("./") || configValue.startsWith("../");
}

function resolveConfigPath(packageJsonRelPath, configValue, workspaceRootInvocation) {
  const normalized = configValue.replaceAll("\\", "/").trim();

  // Dynamic paths are intentionally ignored by this policy check.
  if (/[`$]/.test(normalized)) {
    return null;
  }

  if (path.posix.isAbsolute(normalized)) {
    return normalized.slice(1);
  }

  if (workspaceRootInvocation) {
    return path.posix.normalize(normalized);
  }

  const packageDir = path.posix.dirname(packageJsonRelPath);
  return path.posix.normalize(path.posix.join(packageDir, normalized));
}

function checkPackageJson({ repoRoot, source, relPath, content }) {
  const violations = [];

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    violations.push({
      relPath,
      packageName: "<invalid-json>",
      configValue: "<unreadable>",
      resolvedPath: "<unreadable>",
      reason: `invalid JSON: ${String(error).slice(0, 120)}`,
    });
    return violations;
  }

  const packageName = typeof parsed?.name === "string" ? parsed.name : "<unnamed-package>";
  const testScript = parsed?.scripts?.test;
  if (typeof testScript !== "string") return violations;

  const workspaceRootInvocation = isWorkspaceRootGovernedInvocation(testScript);
  const configValues = extractConfigValues(testScript);
  for (const configValue of configValues) {
    const normalizedConfigValue = configValue.replaceAll("\\", "/").trim();
    const resolvedPath = resolveConfigPath(relPath, normalizedConfigValue, workspaceRootInvocation);
    if (!resolvedPath) continue;

    if (workspaceRootInvocation && isDotRelativePath(normalizedConfigValue)) {
      violations.push({
        relPath,
        packageName,
        configValue,
        resolvedPath,
        reason:
          "workspace-root governed invocation cannot use relative --config paths; use repo-relative path or invoke run-governed-test.sh from package CWD",
      });
      continue;
    }

    const configContent = readFileContent({ repoRoot, source, relPath: resolvedPath });
    if (configContent !== null) continue;

    violations.push({
      relPath,
      packageName,
      configValue,
      resolvedPath,
      reason: "referenced config file does not exist",
    });
  }

  return violations;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }

  const repoRoot = resolveRepoRoot(options.repoRoot);
  const candidates = listCandidatePaths({
    repoRoot,
    staged: options.staged,
    all: options.all,
    explicitPaths: options.paths,
  });

  const relevant = [...new Set(candidates.map(normalizeRelPath).filter(isRelevantPath))].sort();
  if (relevant.length === 0) {
    process.stdout.write("OK: Jest test config path policy check passed (no relevant package.json paths).\n");
    return;
  }

  const violations = [];
  for (const relPath of relevant) {
    const content = readFileContent({ repoRoot, source: options.source, relPath });
    if (content === null) continue;
    violations.push(...checkPackageJson({ repoRoot, source: options.source, relPath, content }));
  }

  if (violations.length === 0) {
    process.stdout.write(`OK: Jest test config path policy check passed (${relevant.length} package.json file(s) checked).\n`);
    return;
  }

  process.stderr.write("POLICY VIOLATION: Missing Jest config targets in package test scripts.\n");
  for (const violation of violations) {
    process.stderr.write(
      `- ${violation.relPath} (package "${violation.packageName}"): --config ${JSON.stringify(violation.configValue)} -> ${violation.resolvedPath} (${violation.reason})\n`,
    );
  }
  process.exit(1);
}

main();
