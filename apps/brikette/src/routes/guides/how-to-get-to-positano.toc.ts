// src/routes/guides/how-to-get-to-positano.toc.ts
import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import type { GuideExtras, TocItem } from "./how-to-get-to-positano.types";

export function buildTocItems(
  context: GuideSeoTemplateContext,
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
): TocItem[] {
  return buildExtras(context).toc;
}
