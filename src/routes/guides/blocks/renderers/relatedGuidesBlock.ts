import type { BlockAccumulator } from "../blockAccumulator";
import type { RelatedGuidesBlockOptions } from "../types";

export function applyRelatedGuidesBlock(acc: BlockAccumulator, options?: RelatedGuidesBlockOptions): void {
  acc.mergeTemplate({
    relatedGuides: {
      items: Array.isArray(options?.guides)
        ? options.guides.map((key) => ({ key }))
        : acc.manifest.relatedGuides.map((key) => ({ key })),
    },
  });
}
