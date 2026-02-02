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

function run(cmd: string, args: string[]) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
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
  const paletteRegex = `(?:${utilAlternation})-(?:${paletteAlternation})(?:-[0-9]{1,3})?(?:\\/[0-9]{1,3})?`;
  const hexRegex = `(?:${utilAlternation})-\\[#(?:[0-9a-fA-F]{3,8})\\]`;
  const funcRegex = `(?:${utilAlternation})-\\[[^\\]]*(?:rgb|rgba|hsl|hsla)\\([^\\)]*\\)[^\\]]*\\]`;
  const pattern = `${paletteRegex}|${hexRegex}|${funcRegex}`;

  const rg = run("rg", [
    "-l",
    "-g",
    "*.{ts,tsx,js,jsx}",
    "-e",
    pattern,
    "apps",
    "packages",
    "src",
  ]);
  if (rg.error || rg.stdout === null) {
    const fallback = run("git", ["grep", "-l", "-E", pattern, "--", "apps", "packages", "src"]);
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

  const files = listFiles();
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

  for (const group of chunks) {
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
    const result = run(eslintBin, args);
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
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`[lint-report] Wrote ${report.length} files to ${outPath}`);
}

main();
