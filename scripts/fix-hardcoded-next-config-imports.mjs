// scripts/fix-hardcoded-next-config-imports.mjs
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
  "out",
]);

const exts = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".tsx"]);

function* walk(dir) {
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (!IGNORE_DIRS.has(dirent.name)) yield* walk(p);
    } else if (dirent.isFile() && exts.has(path.extname(p))) {
      yield p;
    }
  }
}

function fixFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  const original = src;

  const isProvider = filePath.includes(
    `${path.sep}packages${path.sep}next-config${path.sep}`
  );

  // 1) Replace any hard-coded node_modules path to bare specifier
  src = src.replace(/node_modules\/@acme\/next-config/g, "@acme/next-config");

  // 2) Strip internal "dist" or "src" subpaths on consumers
  if (!isProvider) {
    src = src.replace(/@acme\/next-config\/dist\//g, "@acme/next-config/");
    src = src.replace(/@acme\/next-config\/src\//g, "@acme/next-config/");
  }

  // 3) Inside the provider package, avoid self-import via bare specifier subpaths
  //    Turn "@acme/next-config/<sub>" into "./<sub>"
  if (isProvider) {
    src = src.replace(
      /(['"`])@acme\/next-config\/([^'"`]+)\1/g,
      (_m, q, sub) => `${q}./${sub}${q}`
    );
  }

  if (src !== original) {
    fs.writeFileSync(filePath, src, "utf8");
    console.log(`✓ patched ${path.relative(repoRoot, filePath)}`);
  }
}

function run() {
  let count = 0;
  for (const f of walk(repoRoot)) {
    fixFile(f);
    count++;
  }
  console.log(`Done. Scanned ${count} files.`);
}

run();
