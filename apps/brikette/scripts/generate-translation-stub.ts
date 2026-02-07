/* eslint-disable security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] Script operates on known locale paths */
/**
 * generate-translation-stub.ts
 *
 * Creates a stub translation file for a guide in a target locale by copying
 * the English source and replacing all strings with locale-appropriate placeholders.
 *
 * Usage:
 *   pnpm gen:translation-stub <guideKey> --locale=<locale>
 *
 * Example:
 *   pnpm gen:translation-stub bestTimeToVisit --locale=pl
 *
 * This creates:
 *   apps/brikette/src/locales/pl/guides/content/bestTimeToVisit.json
 *
 * The stub file will contain the same structure as the English file but with
 * all strings replaced by the locale's placeholder phrase.
 */

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

/**
 * Locale-specific placeholder phrases.
 * These are recognized by the translation detection system as "in progress".
 */
const PLACEHOLDERS: Record<string, string> = {
  it: "Traduzione in arrivo.",
  pl: "Tłumaczenie w przygotowaniu.",
  hu: "A fordítás folyamatban van.",
  es: "Traducción en progreso.",
  fr: "Traduction en cours.",
  de: "Übersetzung in Arbeit.",
  ja: "翻訳準備中。",
  ko: "번역 준비 중.",
  zh: "翻译进行中。",
  pt: "Tradução em andamento.",
  ru: "Перевод в процессе.",
  ar: "الترجمة قيد التقدم.",
  hi: "अनुवाद प्रगति पर है।",
  vi: "Đang dịch.",
  sv: "Översättning pågår.",
  no: "Oversettelse pågår.",
  da: "Oversættelse i gang.",
};

/**
 * Recursively replace all strings in an object with a placeholder.
 */
function replaceStrings(obj: unknown, placeholder: string): unknown {
  if (typeof obj === "string") {
    return placeholder;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceStrings(item, placeholder));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceStrings(value, placeholder);
    }
    return result;
  }
  // Preserve numbers, booleans, null
  return obj;
}

function printUsage(): void {
  console.log(`
Usage: pnpm gen:translation-stub <guideKey> --locale=<locale>

Arguments:
  guideKey    The guide key (e.g., bestTimeToVisit, pathOfTheGods)
  --locale    Target locale code (e.g., pl, hu, fr)

Example:
  pnpm gen:translation-stub bestTimeToVisit --locale=pl

Supported locales with placeholder phrases:
  ${Object.keys(PLACEHOLDERS).join(", ")}

Other locales will use "Translation in progress." as the placeholder.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  const guideKey = args.find((arg) => !arg.startsWith("--"));
  const localeArg = args.find((arg) => arg.startsWith("--locale="));

  if (!guideKey || !localeArg) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const locale = localeArg.split("=")[1];
  if (!locale) {
    console.error("Error: Invalid locale format. Use --locale=<code>");
    process.exitCode = 1;
    return;
  }

  const enPath = path.join(LOCALES_ROOT, "en", "guides", "content", `${guideKey}.json`);
  const targetDir = path.join(LOCALES_ROOT, locale, "guides", "content");
  const targetPath = path.join(targetDir, `${guideKey}.json`);

  // Check English source exists
  try {
    await access(enPath);
  } catch {
    console.error(`Error: English source file not found.`);
    console.error(`  Expected: ${enPath}`);
    console.error(`  Tip: Ensure the guideKey is correct (case-sensitive).`);
    process.exitCode = 1;
    return;
  }

  // Check target doesn't already exist
  try {
    await access(targetPath);
    console.error(`Error: Target file already exists.`);
    console.error(`  Path: ${targetPath}`);
    console.error(`  Tip: Delete or rename the existing file first.`);
    process.exitCode = 1;
    return;
  } catch {
    // Good - file doesn't exist yet
  }

  // Read English source
  let enContent: unknown;
  try {
    const enRaw = await readFile(enPath, "utf-8");
    enContent = JSON.parse(enRaw);
  } catch (error) {
    console.error(`Error: Failed to read English source file.`);
    console.error(`  ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  // Generate stub with placeholders
  const placeholder = PLACEHOLDERS[locale] ?? "Translation in progress.";
  const stubContent = replaceStrings(enContent, placeholder);

  // Ensure target directory exists
  try {
    await mkdir(targetDir, { recursive: true });
  } catch {
    // Directory may already exist
  }

  // Write stub file
  try {
    await writeFile(targetPath, JSON.stringify(stubContent, null, 2) + "\n");
  } catch (error) {
    console.error(`Error: Failed to write stub file.`);
    console.error(`  ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Created translation stub:`);
  console.log(`  ${targetPath}`);
  console.log(``);
  console.log(`Next steps:`);
  console.log(`  1. Open the file in your editor`);
  console.log(`  2. Replace "${placeholder}" with actual translations`);
  console.log(`  3. Run the dev server and visit /en/draft to verify`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
