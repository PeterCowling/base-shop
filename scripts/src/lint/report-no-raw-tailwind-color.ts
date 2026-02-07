import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RULE_ID = "ds/no-raw-tailwind-color";
const UTILITIES = ["text", "bg", "border", "ring", "from", "via", "to", "fill", "stroke"];
const PALETTE = [
  "gray",
  "zinc",
  "neutral",
  "slate",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "black",
  "white",
];

function normalizePath(p: string) {
  return p.split(path.sep).join("/");
}

function run(cmd: string, args: string[], timeoutMs?: number) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: timeoutMs,
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096",
    },
  });
}

function parseFileList(output: string | null) {
  return (output ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listFiles() {
  const utilAlternation = UTILITIES.join("|");
  const paletteAlternation = PALETTE.join("|");
  const paletteRegex = `(${utilAlternation})-(${paletteAlternation})(-[0-9]{1,3})?(\\/[0-9]{1,3})?`;
  const hexRegex = `(${utilAlternation})-\\[#([0-9a-fA-F]{3,8})\\]`;
  const funcRegex = `(${utilAlternation})-\\[[^\\]]*(rgb|rgba|hsl|hsla)\\([^\\)]*\\)[^\\]]*\\]`;
  const pattern = `${paletteRegex}|${hexRegex}|${funcRegex}`;

  // Only search in directories that exist
  const searchDirs = ["apps", "packages", "src"].filter((dir) =>
    fs.existsSync(path.join(ROOT, dir))
  );

  if (searchDirs.length === 0) {
    console.warn("[lint-report] No search directories found (apps, packages, src)");
    return [];
  }

  const rg = run("rg", [
    "-l",
    "-g",
    "*.{ts,tsx,js,jsx}",
    "-e",
    pattern,
    ...searchDirs,
  ]);
  if (rg.error || rg.stdout === null) {
    const fallback = run("git", ["grep", "-l", "-E", pattern, "--", ...searchDirs]);
    if (fallback.error) {
      throw new Error(
        `Failed to run rg and git grep fallback: ${fallback.error.message}`,
      );
    }
    if (fallback.status !== null && fallback.status > 1) {
      throw new Error(`Failed to list files with git grep: ${fallback.stderr || fallback.stdout}`);
    }
    if (fallback.status === null && fallback.signal) {
      throw new Error(`git grep process killed by signal: ${fallback.signal}`);
    }
    return parseFileList(fallback.stdout);
  }
  // rg returns exit code 1 when no matches are found, which is not an error
  // Exit code 2+ indicates an actual error
  if (rg.status !== null && rg.status > 1) {
    throw new Error(`Failed to list files with rg: ${rg.stderr || rg.stdout}`);
  }
  // If rg was killed by a signal (status is null) or returned an error status
  if (rg.status === null && rg.signal) {
    throw new Error(`rg process killed by signal: ${rg.signal}`);
  }
  return parseFileList(rg.stdout);
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function main() {
  const outPath =
    process.argv[2] ||
    path.join(ROOT, "tools/eslint-baselines/ds-no-raw-tailwind-color.report.json");
  const eslintBin = path.join(ROOT, "node_modules/.bin/eslint");

  // Check if we can skip regeneration (cached report exists and is recent)
  if (fs.existsSync(outPath) && process.env.CI === "true") {
    const stats = fs.statSync(outPath);
    const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;
    // If report is less than 60 minutes old in CI, reuse it
    if (ageMinutes < 60) {
      console.log(`[lint-report] Using cached report (${Math.round(ageMinutes)}min old)`);
      return;
    }
  }

  // Add timeout support (default: 3 minutes total)
  const TIMEOUT_MS = parseInt(process.env.LINT_TIMEOUT_MS || "180000", 10);
  const startTime = Date.now();

  const files = listFiles();
  console.log(`[lint-report] Found ${files.length} files with potential violations`);

  const chunks = chunk(files, 500);
  const report: Array<{
    filePath: string;
    messages: Array<{
      ruleId?: string;
      messageId?: string;
      message: string;
      line?: number;
      column?: number;
    }>;
  }> = [];

  for (let i = 0; i < chunks.length; i++) {
    const group = chunks[i];
    const elapsed = Date.now() - startTime;
    const remaining = TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      console.warn(`[lint-report] Timeout reached after ${i}/${chunks.length} chunks. Using partial results.`);
      break;
    }

    const args = [
      "--format",
      "json",
      "--no-warn-ignored",
      "--ignore-pattern",
      "**/dist/**",
      "--ignore-pattern",
      "**/.next/**",
      ...group,
    ];

    // Give each chunk a proportional timeout with minimum 10s
    const chunkTimeout = Math.max(10000, Math.floor(remaining / (chunks.length - i)));
    const result = run(eslintBin, args, chunkTimeout);

    if (result.error) {
      if ((result.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
        console.warn(`[lint-report] Chunk ${i + 1}/${chunks.length} timed out, skipping`);
        continue;
      }
      throw result.error;
    }

    if (result.stdout) {
      const parsed = JSON.parse(result.stdout) as typeof report;
      for (const entry of parsed) {
        if (!entry.messages?.length) continue;
        const messages = entry.messages.filter((msg) => msg.ruleId === RULE_ID);
        if (messages.length > 0) {
          report.push({
            filePath: normalizePath(entry.filePath),
            messages,
          });
        }
      }
    }

    if ((i + 1) % 5 === 0) {
      console.log(`[lint-report] Progress: ${i + 1}/${chunks.length} chunks (${Math.round(elapsed / 1000)}s elapsed)`);
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`[lint-report] Wrote ${report.length} files to ${outPath} in ${Math.round((Date.now() - startTime) / 1000)}s`);
}

main();
