import type { TFunction } from "i18next";

export type ExperienceFeatureKey = "bar" | "hikes" | "concierge";

export type ExperienceFeatureCopy = {
  eyebrow?: string;
  title?: string;
  description?: string;
  highlights?: string[];
  imageAlt?: string;
};

export type Translator = TFunction;

export function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(
  t: Translator | undefined,
  key: string,
  fallbackT?: Translator,
  options?: Record<string, unknown>,
): string {
  const value = (() => {
    if (!t) return "";
    try {
      return normalizeString(
        t(key, {
          defaultValue: "",
          ...(options ?? {}),
        }),
      );
    } catch {
      return "";
    }
  })();

  if (value && value !== key) return value;

  const fallbackValue = (() => {
    if (!fallbackT) return "";
    try {
      return normalizeString(
        fallbackT(key, {
          defaultValue: "",
          ...(options ?? {}),
        }),
      );
    } catch {
      return "";
    }
  })();

  return fallbackValue && fallbackValue !== key ? fallbackValue : "";
}

export function readFeatureCopy(
  t: Translator | undefined,
  key: ExperienceFeatureKey,
  fallbackT?: Translator,
): ExperienceFeatureCopy | null {
  const readFrom = (translator?: Translator): ExperienceFeatureCopy | null => {
    if (!translator) return null;
    try {
      const raw = translator(`sections.${key}`, { returnObjects: true }) as unknown;
      if (!isRecord(raw)) return null;
      const eyebrow = normalizeString(raw["eyebrow"]);
      const title = normalizeString(raw["title"]);
      const description = normalizeString(raw["description"]);
      const imageAlt = normalizeString(raw["imageAlt"]);
      const highlightsRaw = raw["highlights"];
      const highlights = Array.isArray(highlightsRaw)
        ? highlightsRaw
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      return { eyebrow, title, description, highlights, imageAlt };
    } catch {
      return null;
    }
  };

  return readFrom(t) ?? readFrom(fallbackT);
}

