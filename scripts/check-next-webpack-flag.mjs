#!/usr/bin/env node
// Enforce repo policy for `next dev` / `next build` invocations in:
// - apps/<app>/package.json (scripts)
// - packages/<pkg>/package.json (scripts)
// - packages/<group>/<pkg>/package.json (scripts)
// - .github/workflows/*.yml / .github/workflows/*.yaml (run steps)
//
// Policy is fail-closed by default (`--webpack` required), with explicit
// app/command exceptions via matrix rules.

import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const RULE_REQUIRE_WEBPACK = "require-webpack";
const RULE_ALLOW_ANY = "allow-any";

const DEFAULT_COMMAND_POLICY = Object.freeze({
  dev: RULE_REQUIRE_WEBPACK,
  build: RULE_REQUIRE_WEBPACK,
});

const APP_COMMAND_POLICY_MATRIX = Object.freeze({
  brikette: Object.freeze({
    dev: RULE_ALLOW_ANY,
    build: RULE_REQUIRE_WEBPACK,
  }),
});

const WORKFLOW_APP_MATRIX = Object.freeze({
  "brikette.yml": "brikette",
  "brikette.yaml": "brikette",
});

const USAGE = `Usage:
  node scripts/check-next-webpack-flag.mjs [options] [--paths <p1> <p2> ...]

Options:
  --repo-root <path>   Repo root. If omitted, uses: git rev-parse --show-toplevel
  --source <mode>      Where to read file contents from:
                       - fs (default): filesystem under --repo-root
                       - index: git index (staged), via "git show :<path>"
                       - ref:<sha>: git object, via "git show <sha>:<path>"
  --staged             Check staged paths (git diff --cached --name-only). Implies --source index.
  --all                Check all tracked relevant files (git ls-files). Uses --source (default fs).
  --paths ...          Explicit paths (repo-relative). If omitted, reads newline-delimited paths from stdin.

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
  const res = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // git ls-files can be >1MB in this repo; raise maxBuffer to avoid ENOBUFS.
    maxBuffer: 50 * 1024 * 1024,
  });
  if (res.status !== 0) {
    if (allowFail) return null;
    const stderr = (res.stderr || "").trim();
    die(`ERROR: git ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`);
  }
  return (res.stdout || "").toString();
}

function resolveRepoRoot(cliRepoRoot) {
  if (cliRepoRoot) return path.resolve(cliRepoRoot);
  // Works for normal dev + CI; tests can pass --repo-root to avoid git.
  const res = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (res.status !== 0) die("ERROR: not in a git repo (or pass --repo-root).");
  return (res.stdout || "").trim();
}

function readStdin() {
  try {
    // 0 is stdin FD; works in Node without extra deps.
    const buf = fs.readFileSync(0);
    return buf.toString("utf8");
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
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      out.help = true;
      continue;
    }
    if (a === "--repo-root") {
      out.repoRoot = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (a === "--source") {
      out.source = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (a === "--staged") {
      out.staged = true;
      continue;
    }
    if (a === "--all") {
      out.all = true;
      continue;
    }
    if (a === "--paths") {
      i += 1;
      while (i < argv.length && !argv[i].startsWith("--")) {
        out.paths.push(argv[i]);
        i += 1;
      }
      i -= 1;
      continue;
    }

    die(`ERROR: unknown arg: ${a}\n\n${USAGE}`);
  }

  if (out.staged) out.source = "index";

  if (!out.source || !["fs", "index"].includes(out.source) && !out.source.startsWith("ref:")) {
    die(`ERROR: invalid --source "${out.source}"\n\n${USAGE}`);
  }
  if (out.staged && out.all) {
    die(`ERROR: --staged and --all are mutually exclusive.\n\n${USAGE}`);
  }

  return out;
}

function normalizeRelPath(p) {
  return p.replaceAll("\\", "/");
}

function isRelevantPath(p) {
  if (!p) return false;
  const norm = normalizeRelPath(p);
  if (norm.startsWith("apps/") || norm.startsWith("packages/")) {
    if (norm.endsWith("/package.json")) return true;
  }
  if (norm.startsWith(".github/workflows/")) {
    if (norm.endsWith(".yml") || norm.endsWith(".yaml")) return true;
  }
  return false;
}

function firstSeparatorIndex(s) {
  const seps = ["&&", "||", ";", "\n"];
  let best = -1;
  for (const sep of seps) {
    const idx = s.indexOf(sep);
    if (idx === -1) continue;
    if (best === -1 || idx < best) best = idx;
  }
  return best;
}

function hasWebpackFlag(segment) {
  return /(^|\s)--webpack(\s|$)/.test(segment);
}

function resolveAppPolicy(relPath) {
  const norm = normalizeRelPath(relPath);

  const appPackage = norm.match(/^apps\/([^/]+)\/package\.json$/);
  if (appPackage) {
    const appId = appPackage[1];
    return APP_COMMAND_POLICY_MATRIX[appId] || DEFAULT_COMMAND_POLICY;
  }

  const workflow = norm.match(/^\.github\/workflows\/([^/]+)$/);
  if (workflow) {
    const workflowName = workflow[1];
    const appId = WORKFLOW_APP_MATRIX[workflowName];
    if (appId) return APP_COMMAND_POLICY_MATRIX[appId] || DEFAULT_COMMAND_POLICY;
  }

  return DEFAULT_COMMAND_POLICY;
}

function shouldRequireWebpack({ relPath, kind }) {
  const policy = resolveAppPolicy(relPath);
  const rule = policy[kind] || DEFAULT_COMMAND_POLICY[kind] || RULE_REQUIRE_WEBPACK;
  return rule === RULE_REQUIRE_WEBPACK;
}

function findPolicyViolations(command, { relPath }) {
  const missing = [];
  const re = /\bnext\s+(dev|build)\b/g;
  let m;
  while ((m = re.exec(command)) !== null) {
    const start = m.index;
    const rest = command.slice(start);
    const sepIdx = firstSeparatorIndex(rest);
    const segment = (sepIdx === -1 ? rest : rest.slice(0, sepIdx)).trim();
    if (!shouldRequireWebpack({ relPath, kind: m[1] })) {
      continue;
    }
    if (!hasWebpackFlag(segment)) {
      missing.push({ segment, kind: m[1] });
    }
  }
  return missing;
}

function joinBackslashContinuations(lines) {
  const out = [];
  let acc = "";
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (!acc) acc = line;
    else acc += " " + line.trimStart();

    if (/[\\]\s*$/.test(line)) {
      // Keep accumulating.
      continue;
    }
    out.push(acc);
    acc = "";
  }
  if (acc) out.push(acc);
  return out;
}

function readFileContent({ repoRoot, source, relPath }) {
  if (source === "fs") {
    const abs = path.join(repoRoot, relPath);
    if (!fs.existsSync(abs)) return null;
    return fs.readFileSync(abs, "utf8");
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

function checkPackageJson({ repoRoot, source, relPath, content }) {
  const errors = [];
  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    errors.push(`- ${relPath}: invalid JSON (${String(e).slice(0, 80)})`);
    return errors;
  }

  const scripts = json?.scripts;
  if (!scripts || typeof scripts !== "object") return errors;

  for (const [name, cmd] of Object.entries(scripts)) {
    if (typeof cmd !== "string") continue;
    const missing = findPolicyViolations(cmd, { relPath });
    if (!missing.length) continue;

    for (const seg of missing) {
      errors.push(
        `- ${relPath} (script "${name}"): found "next ${seg.kind}" without --webpack: ${JSON.stringify(seg.segment)}`,
      );
    }
  }

  return errors;
}

function checkWorkflow({ relPath, content }) {
  const errors = [];
  const rawLines = content.split("\n");
  const logical = joinBackslashContinuations(rawLines);

  for (let i = 0; i < logical.length; i += 1) {
    const line = logical[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith("#")) continue;

    const missing = findPolicyViolations(line, { relPath });
    if (!missing.length) continue;

    // Best-effort line number: map logical lines back to raw approx by counting newlines.
    const approxLineNo = rawLines.slice(0, rawLines.indexOf(line.split("\n")[0]) + 1).length || i + 1;
    for (const seg of missing) {
      errors.push(
        `- ${relPath}:${approxLineNo}: found "next ${seg.kind}" without --webpack: ${JSON.stringify(seg.segment)}`,
      );
    }
  }
  return errors;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  const repoRoot = resolveRepoRoot(args.repoRoot);

  let paths = args.paths.slice();
  if (args.staged) {
    const out = git(repoRoot, ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"]);
    paths = out.split("\n").map((s) => s.trim()).filter(Boolean);
  } else if (args.all) {
    const out = git(repoRoot, ["ls-files"]);
    paths = out.split("\n").map((s) => s.trim()).filter(Boolean);
  } else if (paths.length === 0) {
    const stdin = readStdin();
    paths = stdin.split("\n").map((s) => s.trim()).filter(Boolean);
  }

  const relevant = Array.from(new Set(paths.filter(isRelevantPath))).sort();
  if (relevant.length === 0) {
    process.exit(0);
  }

  const violations = [];
  for (const relPath of relevant) {
    const content = readFileContent({ repoRoot, source: args.source, relPath });
    if (content == null) continue;

    if (relPath.endsWith("/package.json")) {
      violations.push(...checkPackageJson({ repoRoot, source: args.source, relPath, content }));
      continue;
    }
    if (relPath.startsWith(".github/workflows/")) {
      violations.push(...checkWorkflow({ relPath, content }));
      continue;
    }
  }

  if (violations.length > 0) {
    process.stderr.write("------------------------------------------------------------------\n");
    process.stderr.write("POLICY VIOLATION: Next.js command violates bundler policy matrix\n");
    process.stderr.write("------------------------------------------------------------------\n\n");
    process.stderr.write("This repo enforces an app/command policy matrix for `next dev` / `next build`.\n");
    process.stderr.write("Default behavior is fail-closed: `--webpack` required unless explicitly allowed.\n\n");
    process.stderr.write("Violations:\n");
    process.stderr.write(violations.map((v) => `  ${v}`).join("\n"));
    process.stderr.write("\n\nFix: add `--webpack` to the affected command(s), or update matrix rules intentionally.\n");
    process.exit(1);
  }

  process.exit(0);
}

// Top-level await not used; keep Node 18+ compatibility.
main().catch((err) => die(`ERROR: ${err?.stack || err}`));
