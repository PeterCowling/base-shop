import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";

export function legacyGuideKeyCandidates(guideKey: GuideKey): string[] {
  const candidates = new Set<string>();
  const add = (value: string | undefined) => {
    if (!value) return;
    const normalised = value.trim();
    if (!normalised || normalised === guideKey) return;
    candidates.add(normalised);
  };

  try {
    const slug = guideSlug("en" as AppLanguage, guideKey);
    if (typeof slug === "string" && slug.trim().length > 0) {
      const camel = slug
        .split(/[^a-z0-9]+/i)
        .filter(Boolean)
        .map((segment, index) => {
          const lower = segment.toLowerCase();
          if (index === 0) return lower;
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("");
      add(camel);
    }
  } catch {
    /* ignore – fall back to canonical key only */
  }

  return Array.from(candidates);
}
