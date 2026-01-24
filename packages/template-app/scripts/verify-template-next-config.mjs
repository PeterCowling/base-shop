// packages/template-app/scripts/verify-template-next-config.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

function findNextConfigFile() {
  const roots = [
    "next.config.ts",
    "next.config.mts",
    "next.config.mjs",
    "next.config.js",
    "next.config.cjs",
  ].map((f) => path.join(appRoot, f));
  for (const c of roots) if (fs.existsSync(c)) return c;

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

(async function main() {
  const cfgPath = findNextConfigFile();
  if (!cfgPath) {
    console.error(
      "Could not find a next.config.* file under:",
      path.relative(repoRoot, appRoot)
    );
    process.exit(1);
  }
  console.info("Found config:", path.relative(repoRoot, cfgPath));

  try {
    await import(pathToFileURL(cfgPath).href); // import the template’s config (runs dev-defaults first)
    console.info("✓ Template next.config imported successfully");
  } catch (e) {
    console.error("✗ Failed to import template next.config");
    console.error(e?.url || e?.message || e);
    process.exit(1);
  }
})();
