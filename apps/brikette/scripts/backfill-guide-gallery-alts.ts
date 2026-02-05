#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- CLI updates repo-local guide content JSON under src/locales. */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guideContentSchema } from "../src/routes/guides/content-schema";
import { i18nConfig, type AppLanguage } from "../src/i18n.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

type Args = {
  guides: string[];
  locales?: string[];
  dryRun: boolean;
};

const LOCALE_PHRASES: Record<AppLanguage, string> = {
  en: "Route step image",
  ar: "صورة خطوة المسار",
  da: "Billede af rutetrin",
  de: "Bild des Routen-Schritts",
  es: "Imagen del paso de la ruta",
  fr: "Image de l’étape de l’itinéraire",
  hi: "मार्ग चरण की छवि",
  hu: "Útvonal lépés képe",
  it: "Immagine del passo del percorso",
  ja: "ルート手順の画像",
  ko: "경로 단계 이미지",
  no: "Bilde av rutesteg",
  pl: "Obraz kroku trasy",
  pt: "Imagem da etapa da rota",
  ru: "Изображение шага маршрута",
  sv: "Bild av ruttsteg",
  vi: "Hình ảnh bước tuyến đường",
  zh: "路线步骤图片",
};

const parseArgs = (): Args => {
  const rawArgs = process.argv.slice(2);
  const guidesArg = rawArgs.find((arg) => arg.startsWith("--guides="))?.slice("--guides=".length);
  const guides = guidesArg
    ? guidesArg
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\.json$/iu, ""))
    : ["positanoNaplesCenterFerry", "positanoToNaplesDirectionsByFerry"];

  const localesArg = rawArgs.find((arg) => arg.startsWith("--locales="))?.slice("--locales=".length);
  const locales = localesArg
    ? localesArg
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
    : undefined;

  const dryRun = rawArgs.includes("--dry-run");

  return { guides, locales, dryRun };
};

const readJson = async (absolutePath: string): Promise<unknown> => {
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as unknown;
};

const main = async (): Promise<void> => {
  const { guides, locales: localesOverride, dryRun } = parseArgs();
  const supportedLocales = (i18nConfig.supportedLngs ?? []) as AppLanguage[];
  const locales = (localesOverride as AppLanguage[] | undefined) ?? supportedLocales;

  let updated = 0;
  let unchanged = 0;
  let missing = 0;
  let errors = 0;

  for (const locale of locales) {
    const phrase = LOCALE_PHRASES[locale] ?? LOCALE_PHRASES.en;

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

      const data = json as Record<string, unknown>;
      const galleries = Array.isArray(data["galleries"]) ? (data["galleries"] as unknown[]) : [];
      if (galleries.length === 0) {
        unchanged += 1;
        continue;
      }

      let changedThisFile = false;
      const nextGalleries = galleries.map((gallery) => {
        if (!gallery || typeof gallery !== "object" || Array.isArray(gallery)) return gallery;
        const galleryRecord = gallery as Record<string, unknown>;
        const items = Array.isArray(galleryRecord["items"]) ? (galleryRecord["items"] as unknown[]) : [];
        const nextItems = items.map((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return item;
          const itemRecord = item as Record<string, unknown>;
          const src = itemRecord["src"];
          if (typeof src !== "string" || src.trim().length === 0) return item;

          const alt = itemRecord["alt"];
          if (typeof alt === "string" && alt.trim().length > 0) return item;

          changedThisFile = true;
          return {
            ...itemRecord,
            alt: `${phrase} ${index + 1}`,
          };
        });

        return { ...galleryRecord, items: nextItems };
      });

      if (!changedThisFile) {
        unchanged += 1;
        continue;
      }

      const next = { ...data, galleries: nextGalleries };
      const finalValidation = guideContentSchema.safeParse(next);
      if (!finalValidation.success) {
        errors += 1;
        console.error(`✗ ${locale}/${guideKey}.json: schema validation failed after backfill`);
        for (const issue of finalValidation.error.issues.slice(0, 6)) {
          console.error(`  - ${issue.path.join(".") || "content"}: ${issue.message}`);
        }
        continue;
      }

      if (!dryRun) {
        await writeFile(filePath, `${JSON.stringify(finalValidation.data, null, 2)}\n`, "utf8");
      }
      updated += 1;
      console.log(`${dryRun ? "DRY" : "✓"} ${locale}/guides/content/${guideKey}.json (gallery alt backfill)`);
    }
  }

  console.log("");
  console.log("Backfill summary");
  console.log(`  Guides: ${guides.join(", ")}`);
  console.log(`  Locales: ${locales.join(", ")}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Missing files: ${missing}`);
  console.log(`  Errors: ${errors}`);

  if (errors > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
