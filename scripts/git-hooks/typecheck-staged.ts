import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function sh(cmd: string): string {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function getRepoRoot(): string {
  return sh("git rev-parse --show-toplevel");
}

function getStagedFiles(repoRoot: string): string[] {
  // Added/copied/modified/renamed (ignore deletions).
  const out = execSync("git diff --cached --name-only -z --diff-filter=ACMR", {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (!out) return [];
  return out
    .split("\0")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isTypecheckRelevant(file: string): boolean {
  return (
    /\.(ts|tsx|mts|cts|d\.ts)$/.test(file) ||
    /(^|\/)tsconfig(\.[^/]+)?\.json$/.test(file) ||
    /(^|\/)package\.json$/.test(file)
  );
}

function findWorkspacePackageName(repoRoot: string, fileRelPath: string): string | null {
  let currentDir = path.join(repoRoot, path.dirname(fileRelPath));

  while (true) {
    const pkgJsonPath = path.join(currentDir, "package.json");
    if (existsSync(pkgJsonPath)) {
      try {
        const raw = readFileSync(pkgJsonPath, "utf8");
        const parsed = JSON.parse(raw) as { name?: string };
        if (parsed?.name) return parsed.name;
      } catch {
        // ignore malformed package.json and keep walking up
      }
    }

    if (currentDir === repoRoot) break;
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  return null;
}

function main() {
  const repoRoot = getRepoRoot();
  const stagedFiles = getStagedFiles(repoRoot);
  const relevant = stagedFiles.filter(isTypecheckRelevant);

  if (relevant.length === 0) {
    console.log("[typecheck:staged] No staged TS/tsconfig/package.json changes — skipping.");
    return;
  }

  const packageNames = new Set<string>();
  for (const file of relevant) {
    const pkgName = findWorkspacePackageName(repoRoot, file);
    if (pkgName) packageNames.add(pkgName);
  }

  if (packageNames.size === 0) {
    console.log("[typecheck:staged] No workspace package.json found for staged changes — skipping.");
    return;
  }

  const filters = Array.from(packageNames)
    .sort()
    .map((name) => `--filter=${name}`);

  console.log(`[typecheck:staged] Running typecheck for ${packageNames.size} workspace(s):`);
  for (const name of Array.from(packageNames).sort()) {
    console.log(`  - ${name}`);
  }

  const res = spawnSync("pnpm", ["-w", "turbo", "run", "typecheck", ...filters], { stdio: "inherit" });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

main();

