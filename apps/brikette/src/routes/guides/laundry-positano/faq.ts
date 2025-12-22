// src/routes/guides/laundry-positano/faq.ts
import type { TFunction } from "i18next";

import appI18n from "@/i18n";
import { ensureStringArray } from "@/utils/i18nContent";

import type { GuideFaq } from "./types";

export function getGuidesTranslator(locale: string): TFunction<"guides"> {
  return appI18n.getFixedT(locale, "guides") as TFunction<"guides">;
}

export function normaliseFaqs(value: unknown): GuideFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const q = typeof record["q"] === "string" ? record["q"].trim() : "";
      const a = ensureStringArray(record["a"])
        .map((answer) => answer.trim())
        .filter((answer) => answer.length > 0);
      if (q.length === 0 || a.length === 0) return null;
      return { q, a } satisfies GuideFaq;
    })
    .filter((faq): faq is GuideFaq => faq != null);
}
