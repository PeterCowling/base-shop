import { ensureStringArray } from "@/utils/i18nContent";
import { slugifyWithFallback } from "@/utils/slugify";

type GuideSection = { id: string; title: string; body: string[] };
type GuideFaq = { q: string; a: string[] };
type TocEntry = { href: string; label: string };

export type GuideNormaliserOptions = {
  trimBodyLines?: boolean;
};

export function createGuideNormalisers({ trimBodyLines = false }: GuideNormaliserOptions = {}) {
  const normaliseLines = (value: unknown): string[] => {
    const lines = ensureStringArray(value);
    return trimBodyLines ? lines.map((line) => line.trim()) : lines;
  };

  const normaliseSections = (value: unknown): GuideSection[] => {
    if (!Array.isArray(value)) return [];

    const usedIds = new Set<string>();
    const duplicateCounts = new Map<string, number>();

    const claimId = (baseId: string): string => {
      let count = duplicateCounts.get(baseId) ?? 0;
      let candidate: string;
      do {
        count += 1;
        candidate = count === 1 ? baseId : `${baseId}-${count}`;
      } while (usedIds.has(candidate));
      duplicateCounts.set(baseId, count);
      usedIds.add(candidate);
      return candidate;
    };

    return value
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;

        const record = entry as Record<string, unknown>;
        const rawTitle = typeof record["title"] === "string" ? record["title"].trim() : "";
        const title = rawTitle.length > 0 ? rawTitle : `Section ${index + 1}`;
        const rawId = typeof record["id"] === "string" ? record["id"].trim() : "";
        if (rawId.length > 0) {
          usedIds.add(rawId);
        }
        const baseId = rawId.length > 0 ? rawId : slugifyWithFallback(title, `section-${index + 1}`);
        const id = rawId.length > 0 ? rawId : claimId(baseId);
        const body = normaliseLines(record["body"]);

        if (title.length === 0 && body.length === 0) return null;

        return { id, title, body } satisfies GuideSection;
      })
      .filter((section): section is GuideSection => section != null);
  };

  const normaliseFaqs = (value: unknown): GuideFaq[] => {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;

        const record = entry as Record<string, unknown>;
        const question = typeof record["q"] === "string" ? record["q"].trim() : "";
        const answers = normaliseLines(record["a"]);

        if (question.length === 0 && answers.length === 0) return null;

        return { q: question, a: answers } satisfies GuideFaq;
      })
      .filter((faq): faq is GuideFaq => faq != null);
  };

  const normaliseToc = (value: unknown): TocEntry[] => {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;

        const record = entry as Record<string, unknown>;
        const href = typeof record["href"] === "string" ? record["href"].trim() : "";
        const label = typeof record["label"] === "string" ? record["label"].trim() : "";

        if (href.length === 0 || label.length === 0) return null;

        return { href, label } satisfies TocEntry;
      })
      .filter((item): item is TocEntry => item != null);
  };

  return { normaliseSections, normaliseFaqs, normaliseToc };
}
