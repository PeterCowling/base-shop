// src/routes/guides/laundry-positano/createTocBuilder.ts
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";

import type { GuideExtras } from "./types";

export function createTocBuilder(
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
  context: GuideSeoTemplateContext,
): GuideExtras["tocItems"] {
  return buildExtras(context).tocItems;
}
