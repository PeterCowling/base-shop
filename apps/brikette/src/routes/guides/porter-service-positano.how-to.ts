import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { createPorterHowToSteps } from "./porter-service-positano.extras";
import type { GuideExtras } from "./porter-service-positano.types";

export function createBuildHowToSteps(
  buildGuideExtras: (context: GuideSeoTemplateContext) => GuideExtras,
): (context: GuideSeoTemplateContext) => ReturnType<typeof createPorterHowToSteps> {
  return (context) => {
    const extras = buildGuideExtras(context);
    return createPorterHowToSteps(context, extras);
  };
}
