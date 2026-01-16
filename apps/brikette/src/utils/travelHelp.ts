// src/utils/travelHelp.ts
// -----------------------------------------------------------------------------
// Helpers for working with the travel-help article copy across runtimes.
// -----------------------------------------------------------------------------

import { i18nConfig } from "@/i18n.config";

export interface TravelHelpResource {
  slug?: string;
  headings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

export interface TravelHelpFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface TravelHelpData {
  slug: string;
  items: TravelHelpFaqItem[];
}

const normalise = (value?: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const collectKeys = (
  primary?: TravelHelpResource | null,
  fallback?: TravelHelpResource | null,
): Set<string> => {
  const keys = new Set<string>();
  const append = (map?: Record<string, unknown>) => {
    if (!map) return;
    Object.keys(map).forEach((key) => {
      if (key) keys.add(key);
    });
  };
  append(primary?.content as Record<string, unknown> | undefined);
  append(primary?.headings as Record<string, unknown> | undefined);
  append(fallback?.content as Record<string, unknown> | undefined);
  append(fallback?.headings as Record<string, unknown> | undefined);
  return keys;
};

export const parseTravelHelpResource = (
  primary?: TravelHelpResource | null,
  fallback?: TravelHelpResource | null,
): TravelHelpData => {
  const slug = normalise(primary?.slug) || normalise(fallback?.slug) || "travel-help";
  const keys = collectKeys(primary, fallback);

  const items: TravelHelpFaqItem[] = [];
  keys.forEach((key) => {
    const question =
      normalise((primary?.headings ?? {})[key]) || normalise((fallback?.headings ?? {})[key]);
    const answer =
      normalise((primary?.content ?? {})[key]) || normalise((fallback?.content ?? {})[key]);

    if (!question || !answer) return;

    items.push({ id: key, question, answer });
  });

  return { slug, items } satisfies TravelHelpData;
};

const importTravelHelpResource = async (
  lang: string,
): Promise<TravelHelpResource | undefined> => {
  try {
    const travelHelpModule = await import(`../locales/${lang}/travelHelp.json`);
    return travelHelpModule.default as TravelHelpResource;
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`⚠️  Missing travelHelp resource for ${lang}:`, err);
    }
    return undefined;
  }
};

export interface TravelHelpLocaleData extends TravelHelpData {
  lang: string;
}

export const loadTravelHelpLocales = async (): Promise<TravelHelpLocaleData[]> => {
  const languages = [...i18nConfig.supportedLngs];
  const fallback = await importTravelHelpResource("en");
  if (!fallback) throw new Error("English travelHelp translations are required");

  const entries = await Promise.all(
    languages.map(async (lang) => {
      const resource = lang === "en" ? fallback : await importTravelHelpResource(lang);
      const parsed = parseTravelHelpResource(resource, fallback);
      return { lang, ...parsed } satisfies TravelHelpLocaleData;
    }),
  );

  return entries;
};
