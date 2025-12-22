import type { HelpArticleKey } from "@/routes.assistance-helpers";
import * as assistance from "@/routes.assistance-helpers";

import type { ContactCta, QuickLinkItem } from "./types";

type AssistanceModule = typeof assistance;
const HELP_KEY_SET = new Set<HelpArticleKey>(
  (((assistance as Partial<AssistanceModule>).ARTICLE_KEYS ?? []) as readonly HelpArticleKey[])
);

export function normaliseQuickLinks(value: unknown): QuickLinkItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const candidate = item as Record<string, unknown>;
      const label = candidate["label"];
      const description = candidate["description"];
      const slug = candidate["slug"];

      if (typeof label !== "string" || typeof description !== "string") return null;
      if (typeof slug !== "string" || !HELP_KEY_SET.has(slug as HelpArticleKey)) return null;

      return {
        label,
        description,
        slug: slug as HelpArticleKey,
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
