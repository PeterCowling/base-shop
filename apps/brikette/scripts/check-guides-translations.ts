/* eslint-disable security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] CLI audit reads locale JSON files from the app workspace. */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import i18n from "../src/i18n";
import { i18nConfig } from "../src/i18n.config";
import { ensureGuideContent } from "../src/utils/ensureGuideContent";
import { preloadNamespacesWithFallback } from "../src/utils/loadI18nNs";

const STRING_KEYS = [
  "components.planChoice.title",
  "components.planChoice.selectedLabel",
  "components.planChoice.options.ferry",
  "components.planChoice.options.trainBus",
  "components.planChoice.options.transfer",
  "transportNotice.title",
  "transportNotice.items.buses",
  "transportNotice.items.ferries",
  "transportNotice.items.airlink",
  "transportNotice.items.driving",
  "transportNotice.items.premium",
  "transportNotice.srLabel",
] as const;

const LIST_KEYS = [
  { key: "content.backpackerItineraries.intro", guideKey: "backpackerItineraries" },
] as const;

type Failure = { locale: string; key: string; message: string };

const isMeaningfulString = (value: unknown, key: string): boolean =>
  typeof value === "string" && value.trim().length > 0 && value.trim() !== key;

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string") return [value];
  return [];
};

const LIST_SECTION_FIELDS = ["essentials", "typicalCosts"] as const;

const englishGuideContentCache = new Map<string, Record<string, unknown> | undefined>();
const guideListRequirements = new Map<string, string[]>();

const hasListEntries = (value: unknown): boolean => {
  return toStringList(value).some((entry) => entry.trim().length > 0);
};

const getEnglishGuideContent = (guideKey: string): Record<string, unknown> | undefined => {
  if (englishGuideContentCache.has(guideKey)) {
    return englishGuideContentCache.get(guideKey);
  }
  const data = readGuideContent("en", guideKey) as Record<string, unknown> | undefined;
  englishGuideContentCache.set(guideKey, data);
  return data;
};

const ensureGuideListRequirements = (guideKey: string): string[] => {
  if (guideListRequirements.has(guideKey)) {
    return guideListRequirements.get(guideKey)!;
  }
  const requirements: string[] = [];
  const enContent = getEnglishGuideContent(guideKey);
  for (const field of LIST_SECTION_FIELDS) {
    if (hasListEntries(enContent?.[field])) {
      requirements.push(`content.${guideKey}.${field}`);
    }
  }
  guideListRequirements.set(guideKey, requirements);
  return requirements;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_ROOT = path.resolve(__dirname, "..", "src", "locales");

const readJson = (filePath: string): unknown => {
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as unknown;
};

const readGuideContent = (locale: string, guideKey: string): unknown | undefined => {
  const filePath = path.join(LOCALES_ROOT, locale, "guides", "content", `${guideKey}.json`);
  try {
    if (!statSync(filePath).isFile()) return undefined;
    return readJson(filePath);
  } catch {
    return undefined;
  }
};

const listGuideContentKeys = (locale: string): string[] => {
  const contentDir = path.join(LOCALES_ROOT, locale, "guides", "content");
  try {
    if (!statSync(contentDir).isDirectory()) return [];
  } catch {
    return [];
  }

  return readdirSync(contentDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/u, ""))
    .sort();
};

const hasIntroContent = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  if (!Array.isArray(value)) return false;
  return value.some((entry) => typeof entry === "string" && entry.trim().length > 0);
};

async function main(): Promise<void> {
  const supported = (i18nConfig.supportedLngs ?? []) as string[];
  const failures: Failure[] = [];

  for (const locale of supported) {
    await preloadNamespacesWithFallback(locale, ["guides", "guidesFallback"], {
      optional: false,
      fallbackOptional: false,
    });

    const t = i18n.getFixedT(locale, "guides");

    for (const { guideKey } of LIST_KEYS) {
      await ensureGuideContent(locale, guideKey, {
        en: () => readGuideContent("en", guideKey),
        ...(locale === "en" ? {} : { local: () => readGuideContent(locale, guideKey) }),
      });
    }

    const guideKeys = listGuideContentKeys(locale);
    for (const guideKey of guideKeys) {
      const localContent = readGuideContent(locale, guideKey) as Record<string, unknown> | undefined;
      if (!localContent || !hasIntroContent(localContent["intro"])) {
        continue;
      }

      await ensureGuideContent(locale, guideKey, {
        en: () => readGuideContent("en", guideKey),
        ...(locale === "en" ? {} : { local: () => localContent }),
      });

      const introKey = `content.${guideKey}.intro`;
      const introValue = t(introKey, { returnObjects: true });
      const introEntries = toStringList(introValue);
      const hasMeaningfulIntro = introEntries.some((entry) => isMeaningfulString(entry, introKey));
      if (!hasMeaningfulIntro) {
        failures.push({ locale, key: introKey, message: "missing or unresolved intro text" });
      }
      const listRequirements = ensureGuideListRequirements(guideKey);
      for (const listKey of listRequirements) {
        const value = t(listKey, { returnObjects: true });
        const entries = toStringList(value);
        const hasMeaningful = entries.some((entry) => isMeaningfulString(entry, listKey));
        if (!hasMeaningful) {
          failures.push({ locale, key: listKey, message: "missing or unresolved list" });
        }
      }
    }

    for (const key of STRING_KEYS) {
      const value = t(key);
      if (!isMeaningfulString(value, key)) {
        failures.push({ locale, key, message: "missing or unresolved string" });
      }
    }

    for (const { key } of LIST_KEYS) {
      const value = t(key, { returnObjects: true });
      const entries = toStringList(value);
      const hasMeaningful = entries.some((entry) => isMeaningfulString(entry, key));
      if (!hasMeaningful) {
        failures.push({ locale, key, message: "missing or unresolved list" });
      }
    }
  }

  if (failures.length > 0) {
    console.error("Guide translation checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure.locale} :: ${failure.key} :: ${failure.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Guide translation checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
