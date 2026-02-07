#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- CLI updates repo-local guide content JSON under src/locales. */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig, type AppLanguage } from "../src/i18n.config";
import { guideContentSchema } from "../src/routes/guides/content-schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

type Args = {
  guides: string[];
  locales?: string[];
  dryRun: boolean;
};

const parseArgs = (): Args => {
  const raw = process.argv.slice(2);
  const guidesArg = raw.find((arg) => arg.startsWith("--guides="))?.slice("--guides=".length);
  const guides = guidesArg
    ? guidesArg
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\.json$/iu, ""))
    : [];

  if (guides.length === 0) {
    throw new Error('Missing required arg: --guides="positanoSalernoBus,salernoPositanoBus"');
  }

  const localesArg = raw.find((arg) => arg.startsWith("--locales="))?.slice("--locales=".length);
  const locales = localesArg
    ? localesArg
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
    : undefined;

  const dryRun = raw.includes("--dry-run");

  return { guides, locales, dryRun };
};

const readJson = async (absolutePath: string): Promise<unknown> => {
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as unknown;
};

const isEmptyObject = (value: unknown): boolean =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value as Record<string, unknown>).length === 0;

const main = async (): Promise<void> => {
  const { guides, locales: localesOverride, dryRun } = parseArgs();
  const supportedLocales = (i18nConfig.supportedLngs ?? []) as AppLanguage[];
  const locales = (localesOverride as AppLanguage[] | undefined) ?? supportedLocales;

  let updated = 0;
  let unchanged = 0;
  let missing = 0;
  let errors = 0;

  for (const locale of locales) {
    for (const guideKey of guides) {
      const filePath = path.join(LOCALES_ROOT, locale, "guides", "content", `${guideKey}.json`);
      let json: unknown;
      try {
        json = await readJson(filePath);
      } catch {
        missing += 1;
        continue;
      }

      if (!json || typeof json !== "object" || Array.isArray(json)) {
        errors += 1;
        console.error(`✗ ${locale}/${guideKey}.json: expected top-level object`);
        continue;
      }

      const record = json as Record<string, unknown>;
      const intro = record["intro"];
      if (!isEmptyObject(intro)) {
        unchanged += 1;
        continue;
      }

      const next = { ...record };
      delete next["intro"];

      const validation = guideContentSchema.safeParse(next);
      if (!validation.success) {
        errors += 1;
        console.error(`✗ ${locale}/${guideKey}.json: still invalid after removing empty intro`);
        for (const issue of validation.error.issues.slice(0, 6)) {
          console.error(`  - ${issue.path.join(".") || "content"}: ${issue.message}`);
        }
        continue;
      }

      if (!dryRun) {
        await writeFile(filePath, `${JSON.stringify(validation.data, null, 2)}\n`, "utf8");
      }

      updated += 1;
      console.log(`${dryRun ? "DRY" : "✓"} ${locale}/guides/content/${guideKey}.json (removed empty intro)`);
    }
  }

  console.log("");
  console.log("Fix summary");
  console.log(`  Guides: ${guides.join(", ")}`);
  console.log(`  Locales: ${locales.join(", ")}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Missing: ${missing}`);
  console.log(`  Errors: ${errors}`);

  if (errors > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

