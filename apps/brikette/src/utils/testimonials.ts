 
// src/utils/testimonials.ts
// -----------------------------------------------------------------------------
// Helpers for working with Hostelworld testimonial translations across runtimes.
// -----------------------------------------------------------------------------

import { isSupportedLanguage } from "@/config";
import { i18nConfig } from "@/i18n.config";
import type { LanguageCode, LocalizedString } from "@/types/machine-layer/ml";

interface TestimonialResourceItem {
  rating?: number;
  text?: string;
  datePublished?: string;
}

interface TestimonialResource {
  hostelworld?: {
    featured?: TestimonialResourceItem[];
    latest?: TestimonialResourceItem[];
  };
}

export interface LocalizedTestimonial {
  rating: number;
  text: LocalizedString;
}

export interface LocalizedLatestTestimonial extends LocalizedTestimonial {
  datePublished: string;
}

export interface HostelworldTestimonials {
  featured: LocalizedTestimonial[];
  latest: LocalizedLatestTestimonial[];
}

const normaliseText = (value?: string): string => value?.trim() ?? "";

const normaliseRating = (value?: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  throw new Error("Hostelworld testimonials require numeric ratings");
};

const normaliseDate = (value?: string): string => {
  const normalised = normaliseText(value);
  if (!normalised) {
    throw new Error("Hostelworld testimonials require a publication date");
  }
  return normalised;
};

const importTestimonialsResource = async (lang: string): Promise<TestimonialResource | undefined> => {
  try {
    const testimonialModule = await import(`../locales/${lang}/testimonials.json`);
    return testimonialModule.default as TestimonialResource;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`⚠️  Missing testimonials resource for ${lang}:`, err);
    }
    return undefined;
  }
};

const isLanguageCode = (lang: string): lang is LanguageCode => isSupportedLanguage(lang);

export const loadHostelworldTestimonials = async (): Promise<HostelworldTestimonials> => {
  const languages = [...i18nConfig.supportedLngs];
  const resources = await Promise.all(
    languages.map(async (lang) => ({ lang, resource: await importTestimonialsResource(lang) })),
  );

  const english = resources.find((entry) => entry.lang === "en")?.resource?.hostelworld;
  if (!english?.featured?.length || !english.latest?.length) {
    throw new Error("English Hostelworld testimonials are required");
  }

  const machineLayerResources = resources.filter(
    (entry): entry is { lang: LanguageCode; resource: TestimonialResource | undefined } =>
      isLanguageCode(entry.lang),
  );

  const mapTestimonials = <T extends TestimonialResourceItem>(
    base: T[],
    key: "featured" | "latest",
  ) =>
    base.map((item, index) => {
      const rating = normaliseRating(item.rating);
      const fallbackText = normaliseText(item.text);
      const localized: Partial<Record<LanguageCode, string>> = {};
      let latestDate = "";

      for (const { lang, resource } of machineLayerResources) {
        const match = resource?.hostelworld?.[key]?.[index];
        const text = normaliseText(match?.text) || fallbackText;
        localized[lang] = text || fallbackText;

        if (key === "latest") {
          const candidate = normaliseText(match?.datePublished);
          if (candidate && candidate > latestDate) {
            latestDate = candidate;
          }
        }
      }

      localized.en = localized.en ?? fallbackText;
      if (!localized.en) {
        throw new Error(`Missing English testimonial text for ${key} #${index}`);
      }

      const baseResult: LocalizedTestimonial = {
        rating,
        text: localized as LocalizedString,
      };

      if (key === "latest") {
        const fallbackDate = normaliseText(item.datePublished);
        if (fallbackDate && fallbackDate > latestDate) {
          latestDate = fallbackDate;
        }
        return {
          ...baseResult,
          datePublished: normaliseDate(latestDate),
        } satisfies LocalizedLatestTestimonial;
      }

      return baseResult;
    });

  const featured = mapTestimonials(english.featured, "featured") as LocalizedTestimonial[];
  const latest = mapTestimonials(english.latest, "latest") as LocalizedLatestTestimonial[];

  return { featured, latest } satisfies HostelworldTestimonials;
};
