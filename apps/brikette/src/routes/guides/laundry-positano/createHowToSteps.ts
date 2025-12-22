// src/routes/guides/laundry-positano/createHowToSteps.ts
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import { stripGuideLinkTokens } from "../utils/linkTokens";

import type { GuideExtras } from "./types";

export function createHowToSteps(
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
  context: GuideSeoTemplateContext,
) {
  const extras = buildExtras(context);
  if (extras.howToSteps.length > 0 && !extras.howToStepsUsedFallback) {
    return extras.howToSteps.map((name) => ({ name }));
  }
  return extras.sections.map((section) => ({
    name: section.title,
    text: section.body.map(stripGuideLinkTokens).join(" "),
  }));
}
