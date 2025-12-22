import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import type { TFunction } from "i18next";

import { GUIDE_KEY } from "./constants";
import type { FaqItem, Section } from "./types";

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === fallback) {
    return fallback;
  }
  return trimmed;
}

export function normaliseSections(
  value: unknown,
  fallback: TFunction<"guides">
): Section[] {
  const primarySections = ensureArray<Record<string, unknown>>(value);
  const fallbackSections = ensureArray<Record<string, unknown>>(
    fallback(`content.${GUIDE_KEY}.sections`, { returnObjects: true })
  );

  const useFallbackSections = primarySections.length === 0;
  const sectionsSource = useFallbackSections ? fallbackSections : primarySections;

  return sectionsSource
    .map((entry, index) => {
      const fallbackEntry = fallbackSections[index] ?? ({} as Record<string, unknown>);

      const primaryTitle = safeString(entry["title"]);
      const fallbackTitle = useFallbackSections ? safeString(fallbackEntry["title"]) : "";
      const resolvedTitle = primaryTitle || fallbackTitle || `Section ${index + 1}`;

      const primaryBody = ensureStringArray(entry["body"])
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0);
      const fallbackBody = ensureStringArray(fallbackEntry["body"])
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0);
      const body = primaryBody.length > 0 ? primaryBody : fallbackBody;

      if (body.length === 0) {
        return null;
      }

      const defaultIdBase = resolvedTitle.replace(/\s+/g, "-").toLowerCase();
      const defaultId = defaultIdBase.length > 0 ? defaultIdBase : `section-${index + 1}`;
      const id = safeString(entry["id"], defaultId) || defaultId;

      const finalId = id.length > 0 ? id : defaultId;

      return { id: finalId, title: resolvedTitle, body } satisfies Section;
    })
    .filter((section): section is Section => section != null);
}

export function normaliseStringList(value: unknown): string[] {
  return ensureStringArray(value)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function normaliseFaqs(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const q = safeString(record["q"]);
      const a = ensureStringArray(record["a"])
        .map((answer) => answer.trim())
        .filter((answer) => answer.length > 0);
      if (!q || a.length === 0) {
        return null;
      }
      return { q, a } satisfies FaqItem;
    })
    .filter((faq): faq is FaqItem => faq != null);
}
