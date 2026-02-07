#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- CLI script reads guide content from known safe paths */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Read guide keys from generated slugs file
async function loadGuideKeys(): Promise<Set<string>> {
  // Read GENERATED_GUIDE_SLUGS from generated file
  const slugsPath = path.join(APP_ROOT, "src", "data", "generate-guide-slugs.ts");
  const slugsContent = await readFile(slugsPath, "utf8");

  // Extract keys from GENERATED_GUIDE_SLUGS object
  const slugsMatch = slugsContent.match(/export const GENERATED_GUIDE_SLUGS[\s\S]*?= Object\.freeze\(\{([\s\S]*?)\}\)/);
  if (!slugsMatch) {
    throw new Error("Could not find GENERATED_GUIDE_SLUGS");
  }

  // Extract all keys (lines like: keyName: "slug",)
  const keys = slugsMatch[1]
    .split("\n")
    .map(line => line.trim())
    .filter(line => /^[a-zA-Z]/.test(line))
    .map(line => {
      const match = line.match(/^([a-zA-Z0-9_]+):/);
      return match ? match[1] : null;
    })
    .filter((key): key is string => key !== null);

  return new Set(keys);
}

async function loadHowToSlugs(): Promise<Set<string>> {
  // Special-case: the how-to-get-here index page is a reserved slug used by
  // %HOWTO:how-to-get-here|Label% tokens throughout the content.
  // It is not a route definition key in routes.json.
  const HOW_TO_GET_HERE_INDEX_SLUG = "how-to-get-here";

  // Read route definitions from JSON
  const routesPath = path.join(APP_ROOT, "src", "data", "how-to-get-here", "routes.json");
  const routesContent = await readFile(routesPath, "utf8");
  const routesData = JSON.parse(routesContent) as { routes: Record<string, unknown> };

  const routeSlugs = Object.keys(routesData.routes);

  // Also read guide slugs for howToGetHere
  const slugsPath = path.join(APP_ROOT, "src", "guides", "slugs", "slugs.ts");
  const slugsContent = await readFile(slugsPath, "utf8");

  // Extract howToGetHere slugs from GUIDE_SLUGS
  const howToMatch = slugsContent.match(/howToGetHere: \{([\s\S]*?)\},/);
  const guideSlugs: string[] = [];

  if (howToMatch) {
    const slugLines = howToMatch[1].split("\n");
    for (const line of slugLines) {
      // Match patterns like: slug: { en: "value", ... }
      const slugMatch = line.match(/["']?([a-z-]+)["']?: \{[\s\S]*?en: ["']([^"']+)["']/);
      if (slugMatch && slugMatch[2]) {
        guideSlugs.push(slugMatch[2]);
      }
    }
  }

  return new Set([HOW_TO_GET_HERE_INDEX_SLUG, ...routeSlugs, ...guideSlugs]);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

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
      const [fullMatch, type, target, label] = match;
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
const main = async (): Promise<void> => {
  // Load i18n config
  const i18nConfigPath = path.join(APP_ROOT, "src", "i18n.config.ts");
  const i18nContent = await readFile(i18nConfigPath, "utf8");
  const localesMatch = i18nContent.match(/const SUPPORTED_LANGUAGES = \[([\s\S]*?)\] as const/);
  const supportedLocales = localesMatch
    ? localesMatch[1]
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.startsWith('"'))
        .map(l => l.replace(/^"|",?$/g, ""))
        .filter(Boolean)
    : ["en", "de", "fr", "it", "es", "pt", "ru", "zh", "ja", "ko", "ar", "hi", "vi", "pl", "sv", "no", "da", "hu"];

  const locales = localeFilter
    ? supportedLocales.filter(loc => loc === localeFilter)
    : supportedLocales;

  if (localeFilter && locales.length === 0) {
    console.error(`Error: Locale "${localeFilter}" not found in supported locales.`);
    process.exit(1);
  }

  // Build validation sets
  console.log("Loading guide keys and slugs...");
  const validGuideKeys = await loadGuideKeys();
  const validHowToSlugs = await loadHowToSlugs();

  console.log("Validating guide link tokens...");
  console.log(`Locales: ${locales.join(", ")}`);
  console.log(`Valid guide keys: ${validGuideKeys.size}`);
  console.log(`Valid HOWTO slugs: ${validHowToSlugs.size}`);
  if (guideFilter) {
    console.log(`Guide filter: ${Array.from(guideFilter).sort().join(", ")}`);
  }
  console.log("");

  const violations: LinkViolation[] = [];
  let totalFiles = 0;
  let totalTokens = 0;

  for (const locale of locales) {
    const localeDir = path.join(LOCALES_ROOT, locale);
    const guidesContentDir = path.join(localeDir, "guides", "content");

    let contentFiles: string[];
    try {
      contentFiles = await listJsonFiles(guidesContentDir);
    } catch (error) {
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
  console.log("Validation Summary:");
  console.log(`  Total files scanned: ${totalFiles}`);
  console.log(`  Total tokens found: ${totalTokens}`);
  console.log(`  Invalid tokens: ${violations.length}`);
  console.log("");

  if (violations.length > 0) {
    console.log("Link Token Violations:");
    console.log("");

    for (const violation of violations) {
      console.log(`  ${violation.locale}/guides/content/${violation.file}`);
      console.log(`    Line ${violation.token.line}: %${violation.token.type}:${violation.token.target}|${violation.token.label}%`);
      console.log(`    Error: ${violation.error}`);
      if (violation.suggestion) {
        console.log(`    Suggestion: ${violation.suggestion}`);
      }
      console.log("");
    }

    console.error("Validation failed due to invalid link tokens.");
    process.exitCode = 1;
  } else {
    console.log("✅ All link tokens validated successfully!");
  }
};

main().catch((error) => {
  console.error("Fatal error during validation:");
  console.error(error);
  process.exitCode = 1;
});
