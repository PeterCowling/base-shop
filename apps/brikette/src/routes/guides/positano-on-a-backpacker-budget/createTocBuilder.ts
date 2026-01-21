// src/routes/guides/positano-on-a-backpacker-budget/createTocBuilder.ts
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";

import type { GuideExtras, TocItem } from "./types";

export function createTocBuilder(
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
  context: GuideSeoTemplateContext,
): TocItem[] {
  return buildExtras(context).toc;
}
