import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type Finding = {
  file: string;
  message: string;
};

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

const REPO_ROOT = findRepoRoot(process.cwd());

const SCAN_ROOTS = [path.join(REPO_ROOT, "apps"), path.join(REPO_ROOT, "packages")];

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".wrangler",
  "coverage",
  "dist",
  "node_modules",
  "out",
  ".ts-jest",
]);

const ROUTE_FILE_RE = /[\\/]src[\\/]api[\\/].*[\\/]route\.tsx?$/;

const FORBIDDEN: Array<{ re: RegExp; message: string }> = [
  {
    re: /\bconst\s+SHOP_ID\s*=/,
    message: "Forbidden SHOP_ID constant: require X-Shop-Id or webhook metadata resolution.",
  },
  {
    re: /\bNEXT_PUBLIC_DEFAULT_SHOP\b/,
    message: "Forbidden NEXT_PUBLIC_DEFAULT_SHOP fallback in API routes: require explicit tenant context.",
  },
  {
    re: /\bNEXT_PUBLIC_SHOP_ID\b/,
    message: "Forbidden NEXT_PUBLIC_SHOP_ID fallback in API routes: require explicit tenant context.",
  },
  {
    re: /searchParams\.get\(\s*["']shop["']\s*\)/,
    message: "Forbidden ?shop= tenant selection in API routes: rely on injected X-Shop-Id or webhook metadata.",
  },
];

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    if (!entry.isFile()) continue;
    const fullPath = path.join(dir, entry.name);
    if (!ROUTE_FILE_RE.test(fullPath)) continue;
    out.push(fullPath);
  }
}

function main(): void {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    try {
      if (!statSync(root).isDirectory()) continue;
    } catch {
      continue;
    }
    walk(root, files);
  }

  const findings: Finding[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const rule of FORBIDDEN) {
      if (rule.re.test(content)) {
        findings.push({ file: path.relative(REPO_ROOT, file), message: rule.message });
      }
    }
  }

  if (findings.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`tenant-context-lint: ok (${files.length} route files scanned)`);
    return;
  }

  // eslint-disable-next-line no-console
  console.error("tenant-context-lint: forbidden tenant selection patterns found:");
  for (const finding of findings) {
    // eslint-disable-next-line no-console
    console.error(`- ${finding.file}: ${finding.message}`);
  }
  process.exitCode = 1;
}

main();

