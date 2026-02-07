/**
 * Generic content block handler.
 */
import type { GuideSeoTemplateProps } from "../../guide-seo/types";
import type { GenericContentBlockOptions } from "../types";

import type { BlockAccumulator } from "./BlockAccumulator";

type TemplateFragment = Partial<GuideSeoTemplateProps>;

export function applyGenericContentBlock(acc: BlockAccumulator, options?: GenericContentBlockOptions): void {
  const genericOptions =
    options?.showToc != null || options?.faqHeadingLevel != null
      ? {
          ...(typeof options?.showToc === "boolean" ? { showToc: options.showToc } : {}),
          ...(typeof options?.faqHeadingLevel === "number"
            ? { faqHeadingLevel: options.faqHeadingLevel }
            : {}),
        }
      : undefined;

  const template: TemplateFragment = {
    renderGenericContent: true,
    ...(genericOptions ? { genericContentOptions: genericOptions } : {}),
  };

  if (options?.renderWhenEmpty) {
    template.renderGenericWhenEmpty = true;
  }

  acc.mergeTemplate(template);
}
