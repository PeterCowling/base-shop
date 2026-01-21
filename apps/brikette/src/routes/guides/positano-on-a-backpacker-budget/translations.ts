// src/routes/guides/positano-on-a-backpacker-budget/translations.ts
import type { TFunction } from "i18next";

import appI18n from "@/i18n";
import { type GuideKey,TRANSPORT_LINK_KEYS } from "@/routes.guides-helpers";
import {
  ensureArray,
  ensureStringArray,
  ensureStringArrayPreserveWhitespace,
} from "@/utils/i18nContent";
import { getRequiredString } from "@/utils/translationFallbacks";

import type { FaqItem, TocItem, TransportCompareLink } from "./types";

const VALID_GUIDE_KEYS = new Set<GuideKey>(TRANSPORT_LINK_KEYS as readonly GuideKey[]);

export function getGuidesTranslator(locale: string): TFunction<"guides"> {
  return appI18n.getFixedT(locale, "guides") as TFunction<"guides">;
}

type NormalisedTocItem = TocItem & { hasLabel: boolean };

function normaliseTocItems(value: unknown): NormalisedTocItem[] {
  return ensureArray<Record<string, unknown>>(value)
    .map((item) => {
      const href = typeof item["href"] === "string" ? item["href"].trim() : "";
      const rawLabel = typeof item["label"] === "string" ? item["label"].trim() : "";
      return {
        href,
        label: rawLabel,
        hasLabel: rawLabel.length > 0,
      } satisfies NormalisedTocItem;
    })
    .filter((item) => item.href.length > 0);
}

function normaliseTransportLinks(value: unknown): TransportCompareLink[] {
  // In non-Vite/test contexts, the discovered guide key manifest can be very small
  // (e.g. only a couple of keys). When the manifest looks incomplete, accept any
  // non-empty string key rather than filtering by the manifest to avoid dropping
  // otherwise valid links in content tests.
  const manifestLooksIncomplete = VALID_GUIDE_KEYS.size < 5;
  const allowUnknownKeys = VALID_GUIDE_KEYS.size === 0 || manifestLooksIncomplete;

  return ensureArray<Record<string, unknown>>(value).reduce<TransportCompareLink[]>((acc, item) => {
    const rawKey = typeof item["key"] === "string" ? item["key"].trim() : "";
    if (rawKey.length === 0) {
      return acc;
    }

    const candidateKey = rawKey as GuideKey;
    if (!allowUnknownKeys && !VALID_GUIDE_KEYS.has(candidateKey)) {
      return acc;
    }

    const rawLabel = typeof item["label"] === "string" ? item["label"].trim() : "";

    acc.push({
      key: candidateKey,
      ...(rawLabel.length > 0 ? { label: rawLabel } : {}),
    });
    return acc;
  }, []);
}

function normaliseFaqItems(value: unknown): FaqItem[] {
  return ensureArray<Record<string, unknown>>(value)
    .map((item) => {
      const question = typeof item["q"] === "string" ? item["q"].trim() : "";
      const answers = ensureStringArray(item["a"])
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      return { q: question, a: answers } satisfies FaqItem;
    })
    .filter((item) => item.q.length > 0 && item.a.length > 0);
}

export function getTocItemsWithFallback(
  primary: TFunction<"guides">,
  fallback: TFunction<"guides">,
  key: string,
): TocItem[] {
  const toc = normaliseTocItems(primary(key, { returnObjects: true }));
  const fallbackToc = normaliseTocItems(fallback(key, { returnObjects: true }));

  if (toc.length === 0) {
    return fallbackToc.map((item) => ({
      href: item.href,
      label: item.hasLabel ? item.label : item.href,
    } satisfies TocItem));
  }

  const fallbackMap = new Map(fallbackToc.map((item) => [item.href, item]));
  return toc.map((item) => {
    const fallbackItem = fallbackMap.get(item.href);
    const fallbackLabel = fallbackItem?.hasLabel ? fallbackItem.label : undefined;
    const label = item.hasLabel ? item.label : fallbackLabel ?? item.href;
    return { href: item.href, label } satisfies TocItem;
  });
}

export function getTransportLinksWithFallback(
  primary: TFunction<"guides">,
  fallback: TFunction<"guides">,
  key: string,
): TransportCompareLink[] {
  const links = normaliseTransportLinks(primary(key, { returnObjects: true }));
  if (links.length > 0) {
    return links;
  }

  return normaliseTransportLinks(fallback(key, { returnObjects: true }));
}

export function getFaqItemsWithFallback(
  primary: TFunction<"guides">,
  fallback: TFunction<"guides">,
  keys: { current: string; legacy: string },
): FaqItem[] {
  const faqs = normaliseFaqItems(primary(keys.current, { returnObjects: true }));
  if (faqs.length > 0) {
    return faqs;
  }

  const legacyFaqs = normaliseFaqItems(primary(keys.legacy, { returnObjects: true }));
  if (legacyFaqs.length > 0) {
    return legacyFaqs;
  }

  const fallbackFaqs = normaliseFaqItems(fallback(keys.current, { returnObjects: true }));
  if (fallbackFaqs.length > 0) {
    return fallbackFaqs;
  }

  return normaliseFaqItems(fallback(keys.legacy, { returnObjects: true }));
}

export const getStringWithFallback = (
  primary: TFunction<"guides">,
  fallback: TFunction<"guides">,
  key: string,
): string => getRequiredString(primary, fallback, key);

function resolveStringPreserveWhitespace(translator: TFunction<"guides">, key: string): string | undefined {
  const value = translator(key);
  if (typeof value !== "string") {
    return undefined;
  }
  if (value === key) {
    return undefined;
  }
  if (value.trim().length === 0) {
    return undefined;
  }
  return value;
}

export const getStringWithFallbackPreserveWhitespace = (
  primary: TFunction<"guides">,
  fallback: TFunction<"guides">,
  key: string,
): string | undefined => resolveStringPreserveWhitespace(primary, key) ?? resolveStringPreserveWhitespace(fallback, key);

export const getStringArrayWithFallback = (
  primary: TFunction<"guides">,
  fallback: TFunction<"guides">,
  key: string,
): string[] => {
  const value = ensureStringArrayPreserveWhitespace(primary(key, { returnObjects: true }));
  if (value.length > 0) {
    return value;
  }
  return ensureStringArrayPreserveWhitespace(fallback(key, { returnObjects: true }));
};
