// packages/template-app/scripts/fix-template-next-config.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, ".."); // -> packages/template-app
const repoRoot = path.resolve(appRoot, "..", ".."); // -> monorepo root

const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
  "out",
]);

/** Utilities **/
function run(cmd, args, cwd = repoRoot, allowFail = false) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd, env: process.env });
  if (r.status !== 0 && !allowFail)
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
}

function findNextConfigFile() {
  // Prefer root-level next.config.*
  const roots = [
    "next.config.ts",
    "next.config.mts",
    "next.config.mjs",
    "next.config.js",
    "next.config.cjs",
  ].map((f) => path.join(appRoot, f));
  for (const c of roots) if (fs.existsSync(c)) return c;

  // Fallback: search anywhere under the app, ignoring build dirs
  const queue = [appRoot];
  while (queue.length) {
    const dir = queue.shift();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) queue.push(p);
      } else if (e.isFile()) {
        const name = e.name.toLowerCase();
        if (
          name.startsWith("next.config.") &&
          /\.(ts|mts|mjs|js|cjs)$/.test(name)
        )
          return p;
      }
    }
  }
  return null;
}

function findProviderRoot() {
  // Common workspace layout
  const guess = path.join(repoRoot, "packages", "next-config");
  if (fs.existsSync(guess) && fs.existsSync(path.join(guess, "package.json")))
    return guess;

  // Fallback: scan packages/* for @acme/next-config
  const pkgsRoot = path.join(repoRoot, "packages");
  if (!fs.existsSync(pkgsRoot)) return null;
  for (const name of fs.readdirSync(pkgsRoot)) {
    const p = path.join(pkgsRoot, name);
    const pj = path.join(p, "package.json");
    if (fs.existsSync(pj)) {
      try {
        const j = JSON.parse(fs.readFileSync(pj, "utf8"));
        if (j.name === "@acme/next-config") return p;
      } catch {}
    }
  }
  return null;
}

function bestEntry(providerRoot) {
  // Prefer built dist first, then ESM roots, then named files
  const candidates = [
    "dist/index.js",
    "index.mjs",
    "index.js",
    "next.config.mjs",
    "config.mjs",
    "dist/config.js",
    "next-config.cjs",
    "config.cjs",
  ];
  for (const rel of candidates) {
    if (fs.existsSync(path.join(providerRoot, rel))) return rel;
  }
  return null;
}

function ensureProviderExports(providerRoot) {
  const pkgJsonPath = path.join(providerRoot, "package.json");
  if (!fs.existsSync(pkgJsonPath))
    throw new Error(`Provider package.json not found: ${pkgJsonPath}`);
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));

  // Determine entries
  const entry = bestEntry(providerRoot);
  if (!entry) {
    throw new Error(
      "@acme/next-config has no obvious entry. Create one of: dist/index.js, index.mjs, index.js, next.config.mjs"
    );
  }

  const hasNextDotConfig = fs.existsSync(
    path.join(providerRoot, "next.config.mjs")
  );
  const typesRel = fs.existsSync(path.join(providerRoot, "dist", "index.d.ts"))
    ? "dist/index.d.ts"
    : null;

  // Normalize package.json
  pkg.name = pkg.name || "@acme/next-config";
  pkg.type = pkg.type || "module";
  pkg.main =
    pkg.main ||
    (entry.startsWith("dist/") ||
    entry.endsWith(".js") ||
    entry.endsWith(".mjs")
      ? `./${entry}`
      : undefined);
  if (typesRel) pkg.types = `./${typesRel}`;
  pkg.exports = pkg.exports || {};

  // Root export maps to the best entry
  const isCjs = entry.endsWith(".cjs");
  const root = {};
  if (typesRel) root.types = `./${typesRel}`;
  if (isCjs) {
    root.default = `./${entry}`;
  } else {
    root.import = `./${entry}`;
    root.default = `./${entry}`;
  }
  pkg.exports["."] = root;

  // Expose ./next.config.mjs explicitly if present (so template's import works)
  if (hasNextDotConfig) {
    pkg.exports["./next.config.mjs"] = "./next.config.mjs";
  }

  // Keep files whitelist sane
  const files = new Set(pkg.files || []);
  if (fs.existsSync(path.join(providerRoot, "dist"))) files.add("dist");
  if (entry.includes("/")) files.add(entry.split("/")[0]); // e.g., 'dist'
  if (!entry.includes("/")) files.add(entry); // root file like index.mjs
  if (hasNextDotConfig) files.add("next.config.mjs");
  pkg.files = Array.from(files);

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  return { entry, hasNextDotConfig };
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}
function write(file, src) {
  fs.writeFileSync(file, src, "utf8");
}

function normalizeTemplateImport(cfgPath, providerExports) {
  let src = read(cfgPath);
  // Collect all @acme/next-config specifiers
  const specs = new Set();
  for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g))
    if (m[1].includes("@acme/next-config")) specs.add(m[1]);
  for (const m of src.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g))
    if (m[1].includes("@acme/next-config")) specs.add(m[1]);
  for (const m of src.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g))
    if (m[1].includes("@acme/next-config")) specs.add(m[1]);

  if (specs.size === 0) {
    console.info("No @acme/next-config import in config; nothing to change.");
    return;
  }

  // If template already uses './next.config.mjs' and provider exports it, keep it.
  const wantsNextDotConfig = Array.from(specs).some((s) =>
    s.endsWith("/next.config.mjs")
  );
  let target = null;

  if (wantsNextDotConfig && providerExports.hasNextDotConfig) {
    target = "@acme/next-config/next.config.mjs";
  } else {
    // Fall back to root export (works with index.mjs or dist/index.js)
    target = "@acme/next-config";
  }

  let changed = false;
  for (const s of specs) {
    if (s !== target) {
      const re = new RegExp(
        `(['"])${s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\1`,
        "g"
      );
      src = src.replace(re, (_m, q) => `${q}${target}${q}`);
      changed = true;
    }
  }
  if (changed) {
    write(cfgPath, src);
    console.info(
      `✓ Rewrote ${path.relative(repoRoot, cfgPath)} to use: ${target}`
    );
  } else {
    console.info("No changes needed; already using:", target);
  }
}

/** Main **/
(function main() {
  const cfgPath = findNextConfigFile();
  if (!cfgPath) {
    console.error(
      "Could not find next.config.(ts|mts|mjs|js|cjs) under:",
      path.relative(repoRoot, appRoot)
    );
    process.exit(1);
  }
  console.info("Found config:", path.relative(repoRoot, cfgPath));

  const providerRoot = findProviderRoot();
  if (!providerRoot) {
    console.error(
      "Could not locate @acme/next-config package directory in ./packages"
    );
    process.exit(1);
  }

  const { entry, hasNextDotConfig } = ensureProviderExports(providerRoot);
  console.info(`Ensured @acme/next-config exports -> ${entry}`);

  // Don’t try to import the provider here; it may depend on env set by the template’s dev-defaults.
  normalizeTemplateImport(cfgPath, { hasNextDotConfig });

  // Optionally build provider if it has a build script (won’t fail if none)
  const pj = JSON.parse(
    fs.readFileSync(path.join(providerRoot, "package.json"), "utf8")
  );
  if (pj.scripts?.build) {
    run("pnpm", ["--filter", "@acme/next-config", "build"], repoRoot, false);
  } else {
  console.info("Provider has no build script; skipping build.");
  }
})();
