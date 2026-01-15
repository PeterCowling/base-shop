#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const globalCssPath = path.resolve(__dirname, "../src/styles/global.css");
const tokensPath = path.resolve(repoRoot, "packages/themes/base/src/tokens.css");
const builderPath = path.resolve(repoRoot, "packages/ui/src/styles/builder.css");

const readFile = (filePath) => {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 diagnostic script reads repo files
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
};

const countFiles = (dirPath, extensions, limit = 5) => {
  let count = 0;
  const walk = (current) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 diagnostic script reads repo files
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        count += 1;
        if (count >= limit) return;
      }
    }
  };
  try {
    walk(dirPath);
  } catch {
    return 0;
  }
  return count;
};

const logResult = (label, ok, detail = "") => {
  const status = ok ? "OK" : "FAIL";
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`[style-config] ${status}: ${label}${suffix}`);
};

const main = () => {
  const css = readFile(globalCssPath);
  if (!css) {
    console.error(`[style-config] FAIL: Cannot read ${globalCssPath}`);
    process.exit(1);
  }

  const configMatch = css.match(/@config\s+["']([^"']+)["'];/);
  const tailwindImportMatch = css.match(/@import\s+["']tailwindcss["']\s+source\(["']([^"']+)["']\);/);
  const tokensImport = /@import\s+["']@themes\/base\/src\/tokens\.css["'];/.test(css);
  const builderImport = /@import\s+["'][^"']*packages\/ui\/src\/styles\/builder\.css["'];/.test(css);

  logResult("global.css @config directive", Boolean(configMatch));
  logResult("global.css Tailwind import with source()", Boolean(tailwindImportMatch));
  logResult("global.css base theme tokens import", tokensImport);
  logResult("global.css builder.css import", builderImport);

  const configPath = configMatch
    ? path.resolve(path.dirname(globalCssPath), configMatch[1])
    : null;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 diagnostic script reads repo files
  logResult("tailwind config file exists", Boolean(configPath && fs.existsSync(configPath)));

  logResult("base tokens file exists", fs.existsSync(tokensPath), tokensPath);
  logResult("builder.css file exists", fs.existsSync(builderPath), builderPath);

  const sourceMatches = [...css.matchAll(/@source\s+["']([^"']+)["'];/g)];
  if (sourceMatches.length === 0) {
    logResult("@source directives found", false, "none found");
  } else {
    logResult("@source directives found", true, String(sourceMatches.length));
    for (const match of sourceMatches) {
      const relPath = match[1];
      const absPath = path.resolve(path.dirname(globalCssPath), relPath);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 diagnostic script reads repo files
      const exists = fs.existsSync(absPath);
      const count = exists ? countFiles(absPath, [".ts", ".tsx", ".mdx"], 1) : 0;
      logResult(`@source ${relPath}`, exists && count > 0, exists ? `${count}+ files` : "missing");
    }
  }

  const tokens = readFile(tokensPath) ?? "";
  logResult("tokens include --space-2", tokens.includes("--space-2"));
  logResult("tokens include --color-bg", tokens.includes("--color-bg"));
};

main();
