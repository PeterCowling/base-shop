// apps/cms/src/app/cms/wizard/utils/page.ts

import { fillLocales } from "@acme/i18n/fillLocales";
import type { PageComponent } from "@acme/types";
import type { PageInfo } from "../schema";

export function toPageInfo(draft: Partial<PageInfo>): PageInfo {
  return {
    id: draft.id,
    slug: draft.slug ?? "",
    title: fillLocales(draft.title, ""),
    description: fillLocales(draft.description, ""),
    image: fillLocales(draft.image, ""),
    components: draft.components ?? ([] as PageComponent[]),
  };
}
