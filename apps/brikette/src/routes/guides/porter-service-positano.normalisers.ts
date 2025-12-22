import { ensureStringArray } from "@/utils/i18nContent";

import type { GuideFaq, GuideSection, TocEntry } from "./porter-service-positano.types";

export function normaliseSections(value: unknown): GuideSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const rawTitle = typeof record["title"] === "string" ? record["title"].trim() : "";
      const hasMeaningfulTitle = rawTitle.length > 0;
      const body = Array.isArray(record["body"])
        ? ensureStringArray(record["body"])
            .map((paragraph) => paragraph.trim())
            .filter((paragraph) => paragraph.length > 0)
        : [];
      if (!hasMeaningfulTitle && body.length === 0) return null;
      const title = hasMeaningfulTitle ? rawTitle : `Section ${index + 1}`;
      const rawId = typeof record["id"] === "string" ? record["id"].trim() : "";
      const id = rawId.length > 0 ? rawId : title.replace(/\s+/g, "-").toLowerCase();
      return { id, title, body } satisfies GuideSection;
    })
    .filter((section): section is GuideSection => section != null);
}

export function normaliseFaqs(value: unknown): GuideFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const question = typeof record["q"] === "string" ? record["q"].trim() : "";
      const answers = ensureStringArray(record["a"]).map((answer) => answer.trim());
      if (question.length === 0 && answers.length === 0) return null;
      return { q: question, a: answers } satisfies GuideFaq;
    })
    .filter((faq): faq is GuideFaq => faq != null);
}

export function normaliseToc(value: unknown): TocEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const href = typeof record["href"] === "string" ? record["href"].trim() : "";
      const label = typeof record["label"] === "string" ? record["label"].trim() : "";
      if (href.length === 0 || label.length === 0) return null;
      if (seen.has(href)) return null;
      seen.add(href);
      return { href, label } satisfies TocEntry;
    })
    .filter((item): item is TocEntry => item != null);
}
