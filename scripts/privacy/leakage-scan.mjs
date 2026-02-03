#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_TARGETS = [
  "apps/xa/wrangler.toml",
  "apps/xa-b/wrangler.toml",
  "apps/xa-j/wrangler.toml",
];

const BUILTIN_DENYLIST = ["thestylemarket.shop"];

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".map",
  ".md",
  ".mjs",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yml",
  ".yaml",
]);

function sha256Prefix(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function splitDenylistEnv(raw) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      // fall through to line-splitting
    }
  }
  return trimmed
    .split(/\r?\n|,/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const paths = [];
  const denylist = [];

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--help" || token === "-h") {
      return { help: true, paths: [], denylist: [] };
    }
    if (token === "--denylist") {
      const value = args[index + 1];
      if (!value) throw new Error("--denylist requires a value");
      denylist.push(value);
      index += 1;
      continue;
    }
    paths.push(token);
  }

  return { help: false, paths, denylist };
}

async function statSafe(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

async function collectTextFiles(targetPath, out, seen) {
  const resolved = path.resolve(targetPath);
  if (seen.has(resolved)) return;
  seen.add(resolved);

  const stats = await statSafe(resolved);
  if (!stats) return;

  if (stats.isFile()) {
    const ext = path.extname(resolved).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) return;
    out.push(resolved);
    return;
  }

  if (!stats.isDirectory()) return;

  const base = path.basename(resolved);
  if (
    base === "node_modules" ||
    base === ".git" ||
    base === ".turbo" ||
    base === "cache" ||
    base === ".next-cache"
  ) {
    return;
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const child = path.join(resolved, entry.name);
      if (entry.isDirectory()) {
        await collectTextFiles(child, out, seen);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) return;
        out.push(child);
      }
    }),
  );
}

async function readFileLowercase(filePath) {
  const buf = await fs.readFile(filePath);
  if (buf.byteLength > 10_000_000) {
    return null;
  }
  return buf.toString("utf8").toLowerCase();
}

async function main() {
  const { help, paths: cliPaths, denylist: cliDenylist } = parseArgs(process.argv);
  if (help) {
    process.stdout.write(
      [
        "Usage:",
        "  node scripts/privacy/leakage-scan.mjs [paths...]",
        "",
        "Options:",
        "  --denylist <pattern>   Add a (non-secret) substring pattern to scan for",
        "",
        "Environment:",
        "  LEAKAGE_DENYLIST       Additional patterns (JSON array or newline/comma-separated).",
        "                         Treated as potentially secret; values are not printed.",
        "",
        "Notes:",
        "- Exits 1 if any matches are found.",
        "- Defaults to scanning XA wrangler configs (and build output if present).",
        "",
      ].join("\n"),
    );
    return;
  }

  const privatePatterns = splitDenylistEnv(process.env.LEAKAGE_DENYLIST);
  const publicPatterns = [...BUILTIN_DENYLIST, ...cliDenylist].filter(Boolean);

  const targets = cliPaths.length ? cliPaths : [...DEFAULT_TARGETS];
  const xaBuildVercelOutput = "apps/xa/.vercel/output/static";
  const xaBuildNextOutput = "apps/xa/.next";
  const vercelStats = await statSafe(path.resolve(xaBuildVercelOutput));
  if (vercelStats?.isDirectory()) {
    targets.push(xaBuildVercelOutput);
  } else {
    const nextStats = await statSafe(path.resolve(xaBuildNextOutput));
    if (nextStats?.isDirectory()) {
      targets.push(xaBuildNextOutput);
    }
  }

  const files = [];
  const seen = new Set();
  for (const target of targets) {
    // eslint-disable-next-line no-await-in-loop -- bounded path list; clarity > micro-optimizations
    await collectTextFiles(target, files, seen);
  }

  const matches = [];
  const privateMeta = privatePatterns.map((pattern) => ({
    pattern,
    id: sha256Prefix(pattern),
  }));

  for (const filePath of files.sort()) {
    // eslint-disable-next-line no-await-in-loop -- scanning needs per-file IO
    const contentLower = await readFileLowercase(filePath);
    if (contentLower === null) continue;

    for (const pattern of publicPatterns) {
      if (!pattern) continue;
      if (contentLower.includes(pattern.toLowerCase())) {
        matches.push({ filePath, kind: "public", label: pattern });
      }
    }

    for (const { pattern, id } of privateMeta) {
      if (!pattern) continue;
      if (contentLower.includes(pattern.toLowerCase())) {
        matches.push({ filePath, kind: "private", label: id });
      }
    }
  }

  if (!matches.length) {
    process.stdout.write(
      `OK: No leakage matches found. (scanned ${files.length} files; privatePatterns=${privateMeta.length})\n`,
    );
    return;
  }

  process.stderr.write("FAIL: Leakage patterns found:\n");
  for (const match of matches) {
    if (match.kind === "public") {
      process.stderr.write(`- ${match.filePath} (pattern=${match.label})\n`);
      continue;
    }
    process.stderr.write(`- ${match.filePath} (privatePatternSha256Prefix=${match.label})\n`);
  }
  process.exitCode = 1;
}

main().catch((err) => {
  process.stderr.write(`ERROR: ${err?.stack ?? String(err)}\n`);
  process.exit(2);
});

