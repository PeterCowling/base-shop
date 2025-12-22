import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import type { GuideExtras } from "./porter-service-positano.types";

export function createBuildTocItems(
  buildGuideExtras: (context: GuideSeoTemplateContext) => GuideExtras,
): (context: GuideSeoTemplateContext) => GuideExtras["tocItems"] {
  return (context) => buildGuideExtras(context).tocItems;
}
