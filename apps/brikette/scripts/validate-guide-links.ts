#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- GS-001: CLI script reads guide content from known safe paths */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { GuideManifestEntry } from "@acme/guide-system";
import {
  listGuideManifestEntries as _listGuideManifestEntries,
  registerManifestEntries,
  SUPPORTED_LANGUAGES,
} from "@acme/guide-system";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

// Load guide manifest from the JSON snapshot (typed imports, no regex)
function loadManifestFromSnapshot(): GuideManifestEntry[] {
  const snapshotPath = path.join(APP_ROOT, "src", "data", "guides", "guide-manifest-snapshot.json");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- GS-001
  const snapshot = require(snapshotPath) as { entries: GuideManifestEntry[] };
  registerManifestEntries(snapshot.entries);
  return snapshot.entries;
}

// Guide keys from manifest entries (replaces regex parsing of generate-guide-slugs.ts)
function loadGuideKeys(entries: GuideManifestEntry[]): Set<string> {
  return new Set(entries.map((e) => e.key));
}

// HOWTO slugs from route definitions (JSON) + manifest howToGetHere guides
async function loadHowToSlugs(entries: GuideManifestEntry[]): Promise<Set<string>> {
  const HOW_TO_GET_HERE_INDEX_SLUG = "how-to-get-here";

  // Route definitions from JSON (unchanged)
  const routesPath = path.join(APP_ROOT, "src", "data", "how-to-get-here", "routes.json");
  const routesContent = await readFile(routesPath, "utf8");
  const routesData = JSON.parse(routesContent) as { routes: Record<string, unknown> };
  const routeSlugs = Object.keys(routesData.routes);

  // Guide slugs for howToGetHere area (replaces regex parsing of slugs.ts)
  const guideSlugs = entries
    .filter((e) => e.primaryArea === "howToGetHere")
    .map((e) => e.slug);

  return new Set([HOW_TO_GET_HERE_INDEX_SLUG, ...routeSlugs, ...guideSlugs]);
}

// Parse CLI arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const localeFilter = args.find(arg => arg.startsWith("--locale="))?.slice("--locale=".length);
const guideFilterArg = args.find(arg => arg.startsWith("--guides="))?.slice("--guides=".length);
const guideFilter = guideFilterArg
  ? new Set(
      guideFilterArg
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean),
    )
  : null;

// Token pattern from _linkTokens.tsx
const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;

type TokenMatch = {
  type: "LINK" | "HOWTO" | "URL" | "UNKNOWN";
  target: string;
  label: string;
  line: number;
  column: number;
};

type ValidationResult = {
  valid: boolean;
  error?: string;
  suggestion?: string;
};

type LinkViolation = {
  file: string;
  locale: string;
  guideKey: string;
  token: TokenMatch;
  error: string;
  suggestion?: string;
};

/**
 * Extract all link tokens from content string
 */
function extractTokens(content: string): TokenMatch[] {
  const tokens: TokenMatch[] = [];
  const lines = content.split("\n");

  lines.forEach((line, lineIndex) => {
    const regex = new RegExp(TOKEN_PATTERN);
    let match;
    while ((match = regex.exec(line)) !== null) {
      const [_fullMatch, type, target, label] = match;
      if (type && target && label) {
        tokens.push({
          type: type as TokenMatch["type"],
          target: target.trim(),
          label: label.trim(),
          line: lineIndex + 1,
          column: match.index,
        });
      }
    }
  });

  return tokens;
}

/**
 * Validate LINK token against guide manifest
 */
function validateLinkToken(
  target: string,
  validKeys: Set<string>
): ValidationResult {
  if (validKeys.has(target)) {
    return { valid: true };
  }

  // Find close matches for suggestions (Levenshtein-like heuristic)
  const targetLower = target.toLowerCase();
  const closeMatches = Array.from(validKeys)
    .filter((key) => {
      const keyLower = key.toLowerCase();
      // Match if target is substring or first 4 chars match
      return keyLower.includes(targetLower) ||
             targetLower.includes(keyLower.slice(0, 4)) ||
             keyLower.includes(targetLower.slice(0, 4));
    })
    .sort((a, b) => {
      // Prefer exact case-insensitive match
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower === targetLower) return -1;
      if (bLower === targetLower) return 1;
      // Prefer shorter keys (more likely to be correct)
      return a.length - b.length;
    });

  return {
    valid: false,
    error: `Guide key "${target}" not found in manifest`,
    suggestion: closeMatches[0],
  };
}

/**
 * Validate HOWTO token against route definitions and guide slugs
 */
function validateHowtoToken(
  target: string,
  validSlugs: Set<string>
): ValidationResult {
  if (validSlugs.has(target)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `HOWTO slug "${target}" not found in route definitions or guide slugs`,
  };
}

/**
 * Validate URL token for well-formed URLs and security
 */
function validateUrlToken(target: string): ValidationResult {
  const trimmed = target.trim().toLowerCase();

  // Security check: disallow javascript: and data: URLs
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
    return {
      valid: false,
      error: `Unsafe URL protocol detected: ${trimmed.split(":")[0]}:`,
    };
  }

  // Only allow http, https, mailto
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("mailto:")
  ) {
    return {
      valid: false,
      error: `Invalid URL protocol. Must be http://, https://, or mailto:`,
    };
  }

  // Basic URL structure validation
  try {
    if (trimmed.startsWith("mailto:")) {
      // Validate mailto has @ symbol
      const emailPart = target.slice("mailto:".length);
      if (!emailPart.includes("@")) {
        return {
          valid: false,
          error: "Invalid mailto: URL (missing @)",
        };
      }
    } else {
      // Validate http/https URL can be parsed
      new URL(target.trim());
    }
  } catch {
    return {
      valid: false,
      error: "Malformed URL",
    };
  }

  return { valid: true };
}

/**
 * List all JSON files in a directory recursively
 */
const listJsonFiles = async (rootDir: string, relativeDir = ""): Promise<string[]> => {
  const entries = await readdir(path.join(rootDir, relativeDir), { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listJsonFiles(rootDir, nextRelative));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(nextRelative);
    }
  }

  return files.sort();
};

/**
 * Read and parse JSON file
 */
const readJson = async (filePath: string): Promise<unknown> => {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
};

/**
 * Recursively extract all string values from content JSON
 */
function extractStringsFromContent(obj: unknown): string[] {
  const strings: string[] = [];

  if (typeof obj === "string") {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      strings.push(...extractStringsFromContent(item));
    }
  } else if (obj && typeof obj === "object") {
    for (const value of Object.values(obj)) {
      strings.push(...extractStringsFromContent(value));
    }
  }

  return strings;
}

/**
 * Main validation function
 */
// eslint-disable-next-line complexity -- GS-001: CLI validation script
const main = async (): Promise<void> => {
  // Locales from @acme/guide-system (replaces regex parsing of i18n.config.ts)
  const supportedLocales = [...SUPPORTED_LANGUAGES];

  const locales = localeFilter
    ? supportedLocales.filter(loc => loc === localeFilter)
    : supportedLocales;

  if (localeFilter && locales.length === 0) {
    console.error(`Error: Locale "${localeFilter}" not found in supported locales.`);
    process.exit(1);
  }

  // Build validation sets from manifest (typed imports, no regex)
  console.info("Loading guide keys and slugs...");
  const manifestEntries = loadManifestFromSnapshot();
  const validGuideKeys = loadGuideKeys(manifestEntries);
  const validHowToSlugs = await loadHowToSlugs(manifestEntries);

  console.info("Validating guide link tokens...");
  console.info(`Locales: ${locales.join(", ")}`);
  console.info(`Valid guide keys: ${validGuideKeys.size}`);
  console.info(`Valid HOWTO slugs: ${validHowToSlugs.size}`);
  if (guideFilter) {
    console.info(`Guide filter: ${Array.from(guideFilter).sort().join(", ")}`);
  }
  console.info("");

  const violations: LinkViolation[] = [];
  let totalFiles = 0;
  let totalTokens = 0;

  for (const locale of locales) {
    const localeDir = path.join(LOCALES_ROOT, locale);
    const guidesContentDir = path.join(localeDir, "guides", "content");

    let contentFiles: string[];
    try {
      contentFiles = await listJsonFiles(guidesContentDir);
    } catch {
      if (verbose) {
        console.warn(`Warning: Could not read guides content directory for locale "${locale}"`);
      }
      continue;
    }

    for (const relativeFile of contentFiles) {
      const guideKey = path.basename(relativeFile, ".json");
      if (guideFilter && !guideFilter.has(guideKey)) {
        continue;
      }
      totalFiles++;
      const contentPath = path.join(guidesContentDir, relativeFile);

      try {
        const content = await readJson(contentPath);
        const strings = extractStringsFromContent(content);
        const contentText = strings.join("\n");
        const tokens = extractTokens(contentText);

        totalTokens += tokens.length;

        for (const token of tokens) {
          let result: ValidationResult;

          switch (token.type) {
            case "LINK":
              result = validateLinkToken(token.target, validGuideKeys);
              break;
            case "HOWTO":
              result = validateHowtoToken(token.target, validHowToSlugs);
              break;
            case "URL":
              result = validateUrlToken(token.target);
              break;
            default:
              result = {
                valid: false,
                error: `Unknown token type: ${token.type}`,
              };
          }

          if (!result.valid) {
            violations.push({
              file: relativeFile,
              locale,
              guideKey,
              token,
              error: result.error ?? "Validation failed",
              suggestion: result.suggestion,
            });
          }
        }
      } catch (error) {
        if (verbose) {
          console.warn(`Warning: Could not parse ${locale}/${relativeFile}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  // Report results
  console.info("Validation Summary:");
  console.info(`  Total files scanned: ${totalFiles}`);
  console.info(`  Total tokens found: ${totalTokens}`);
  console.info(`  Invalid tokens: ${violations.length}`);
  console.info("");

  if (violations.length > 0) {
    console.info("Link Token Violations:");
    console.info("");

    for (const violation of violations) {
      console.info(`  ${violation.locale}/guides/content/${violation.file}`);
      console.info(`    Line ${violation.token.line}: %${violation.token.type}:${violation.token.target}|${violation.token.label}%`);
      console.info(`    Error: ${violation.error}`);
      if (violation.suggestion) {
        console.info(`    Suggestion: ${violation.suggestion}`);
      }
      console.info("");
    }

    console.error("Validation failed due to invalid link tokens.");
    process.exitCode = 1;
  } else {
    console.info("✅ All link tokens validated successfully!");
  }
};

main().catch((error) => {
  console.error("Fatal error during validation:");
  console.error(error);
  process.exitCode = 1;
});
