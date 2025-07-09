// apps/cms/src/app/cms/wizard/utils/page.ts

import type { Locale, PageComponent } from "@types";
import type { PageInfo } from "../schema";

export function toPageInfo(
  draft: Partial<PageInfo>,
  locales: readonly Locale[]
): PageInfo {
  const blank = Object.fromEntries(locales.map((l) => [l, ""])) as Record<
    Locale,
    string
  >;

  return {
    id: draft.id,
    slug: draft.slug ?? "",
    title: { ...blank, ...draft.title },
    description: { ...blank, ...draft.description },
    image: { ...blank, ...draft.image },
    components: draft.components ?? ([] as PageComponent[]),
  };
}
