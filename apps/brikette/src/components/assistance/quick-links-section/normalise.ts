import { ASSISTANCE_GUIDE_KEYS, isAssistanceGuideKey } from "@/data/assistanceGuideKeys";
import type { GuideKey } from "@/routes.guides-helpers";

import type { ContactCta, QuickLinkItem } from "./types";

const ASSISTANCE_GUIDE_KEY_SET = new Set<GuideKey>(ASSISTANCE_GUIDE_KEYS);

export function normaliseQuickLinks(value: unknown): QuickLinkItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const candidate = item as Record<string, unknown>;
      const label = candidate["label"];
      const description = candidate["description"];
      const slug = candidate["slug"];
      const href = candidate["href"];

      if (typeof label !== "string" || typeof description !== "string") return null;

      // Must have either a valid slug or a valid href
      const hasValidSlug = typeof slug === "string" && isAssistanceGuideKey(slug);
      const hasValidHref = typeof href === "string" && href.trim().length > 0;

      if (!hasValidSlug && !hasValidHref) return null;

      return {
        label,
        description,
        ...(hasValidSlug && { slug: slug as GuideKey }),
        ...(hasValidHref && { href: href as string }),
      } satisfies QuickLinkItem;
    })
    .filter((item): item is QuickLinkItem => Boolean(item));
}

export function normaliseContactCta(value: unknown): ContactCta | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const label = candidate["label"];
  const href = candidate["href"];

  if (typeof label !== "string" || typeof href !== "string") return null;
  if (!href.trim()) return null;

  return { label, href } satisfies ContactCta;
}
