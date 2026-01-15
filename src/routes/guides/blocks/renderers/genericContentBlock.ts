import type { BlockAccumulator, TemplateFragment } from "../blockAccumulator";
import type { GenericContentBlockOptions } from "../types";

export function applyGenericContentBlock(acc: BlockAccumulator, options?: GenericContentBlockOptions): void {
  const genericOptions = options?.showToc != null || options?.faqHeadingLevel != null
    ? {
        showToc: options?.showToc,
        faqHeadingLevel: options?.faqHeadingLevel,
      }
    : undefined;

  const template: TemplateFragment = {
    renderGenericContent: true,
    genericContentOptions: genericOptions,
  };

  if (options?.renderWhenEmpty) {
    template.renderGenericWhenEmpty = true;
  }

  acc.mergeTemplate(template);
}
