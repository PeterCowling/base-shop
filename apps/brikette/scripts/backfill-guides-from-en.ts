#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- CLI script reads/writes guide content from known safe paths */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig } from "../src/i18n.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

type Args = {
  guides: string[];
  locales?: string[];
  backupDir?: string;
};

const parseArgs = (): Args => {
  const args = process.argv.slice(2);

  const guidesArg = args.find(a => a.startsWith("--guides="))?.slice("--guides=".length);
  if (!guidesArg) {
    throw new Error('Missing required arg "--guides=beaches,pathOfTheGodsFerry,..."');
  }

  const guides = guidesArg
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/\.json$/i, ""));

  const localesArg = args.find(a => a.startsWith("--locales="))?.slice("--locales=".length);
  const locales = localesArg
    ? localesArg.split(",").map(s => s.trim()).filter(Boolean)
    : undefined;

  const backupDir = args.find(a => a.startsWith("--backup-dir="))?.slice("--backup-dir=".length);

  return { guides, locales, backupDir };
};

const readJson = async (absolutePath: string): Promise<unknown> => {
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as unknown;
};

const writeJson = async (absolutePath: string, data: unknown): Promise<void> => {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(absolutePath, body, "utf8");
};

const main = async (): Promise<void> => {
  const { guides, locales: localeOverride, backupDir } = parseArgs();

  const supportedLocales = (i18nConfig.supportedLngs ?? []) as string[];
  const locales = localeOverride ?? supportedLocales.filter(l => l !== "en");

  if (locales.length === 0) {
    console.log("No locales selected (note: this script skips en by default).");
    return;
  }

  if (backupDir) {
    await mkdir(backupDir, { recursive: true });
  }

  let changed = 0;
  let skipped = 0;

  for (const guideKey of guides) {
    const enPath = path.join(LOCALES_ROOT, "en", "guides", "content", `${guideKey}.json`);
    const enContent = await readJson(enPath);

    for (const locale of locales) {
      const targetPath = path.join(LOCALES_ROOT, locale, "guides", "content", `${guideKey}.json`);

      if (backupDir) {
        const backupPath = path.join(
          backupDir,
          locale,
          "guides",
          "content",
          `${guideKey}.json`,
        );
        await mkdir(path.dirname(backupPath), { recursive: true });
        const existing = await readFile(targetPath, "utf8");
        await writeFile(backupPath, existing, "utf8");
      }

      await writeJson(targetPath, enContent);
      changed++;
      console.log(`✓ ${locale}/guides/content/${guideKey}.json ← en`);
    }

    skipped++;
  }

  console.log("");
  console.log("Backfill complete.");
  console.log(`Guides processed: ${skipped}`);
  console.log(`Files written: ${changed}`);
  if (backupDir) {
    console.log(`Backup dir: ${backupDir}`);
  }
};

main().catch((error) => {
  console.error("Fatal error during backfill:");
  console.error(error);
  process.exitCode = 1;
});

