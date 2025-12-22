// src/routes/guides/how-to-get-to-positano.normalizers.ts
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { GuideFaq, GuideSection, WhenItem } from "./how-to-get-to-positano.types";

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function normaliseSections(value: unknown): GuideSection[] {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry, index) => {
      const title = safeString(entry["title"]);
      const id = safeString(entry["id"], title ? title.replace(/\s+/g, "-").toLowerCase() : `section-${index}`);
      const bodyCandidates = Array.isArray(entry["body"])
        ? entry["body"]
        : entry["body"] != null
          ? [entry["body"]]
          : [];
      const body = bodyCandidates
        .map((paragraph) => {
          const text = String(paragraph ?? "").trim();
          return text.length > 0 ? text : null;
        })
        .filter((paragraph): paragraph is string => paragraph != null);
      if (title.length === 0 && body.length === 0) return null;
      return {
        id,
        title: title.length > 0 ? title : `Section ${index + 1}`,
        body,
      } satisfies GuideSection;
    })
    .filter((section): section is GuideSection => section != null);
}

export function normaliseWhenItems(value: unknown): WhenItem[] {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry) => {
      const label = safeString(entry["label"]);
      const body = safeString(entry["body"]);
      if (!label && !body) return null;
      return { label, body } satisfies WhenItem;
    })
    .filter((item): item is WhenItem => item != null);
}

export function normaliseFaqs(value: unknown): GuideFaq[] {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry) => {
      const q = safeString(entry["q"]);
      const a = ensureStringArray(entry["a"]).map((answer) => safeString(answer)).filter((answer) => answer.length > 0);
      if (!q || a.length === 0) return null;
      return { q, a } satisfies GuideFaq;
    })
    .filter((faq): faq is GuideFaq => faq != null);
}
