 
/*
 * DEV-1823: Block composer relies on fallback strings pending locale coverage, and this helper file does not
 * represent a route module with direct SEO exports.
 */
// src/routes/guides/blocks/composeBlocks.ts

import type { GuideManifestEntry } from "../guide-manifest";

import {
  applyAlsoHelpfulBlock,
  applyCalloutBlock,
  applyFaqBlock,
  applyGalleryBlock,
  applyGenericContentBlock,
  applyHeroBlock,
  applyJsonLdBlock,
  applyServiceSchemaBlock,
  applyTransportDropInBlock,
  BlockAccumulator,
  type TemplateFragment,
} from "./handlers";
import type { GuideBlockDeclaration } from "./types";

function composeBlock(acc: BlockAccumulator, block: GuideBlockDeclaration): void {
  switch (block.type) {
    case "hero":
      applyHeroBlock(acc, block.options);
      return;
    case "genericContent":
      applyGenericContentBlock(acc, block.options);
      return;
    case "faq":
      applyFaqBlock(acc, block.options);
      return;
    case "gallery":
      applyGalleryBlock(acc, block.options);
      return;
    case "callout":
      applyCalloutBlock(acc, block.options);
      return;
    case "serviceSchema":
      applyServiceSchemaBlock(acc, block.options);
      return;
    case "alsoHelpful":
      applyAlsoHelpfulBlock(acc, block.options);
      return;
    case "jsonLd":
      applyJsonLdBlock(acc, block.options);
      return;
    case "relatedGuides":
      acc.mergeTemplate({
        relatedGuides: {
          items: Array.isArray(block.options?.guides)
            ? block.options?.guides.map((key) => ({ key }))
            : acc.manifest.relatedGuides.map((key) => ({ key })),
        },
      });
      return;
    case "planChoice":
      acc.mergeTemplate({ showPlanChoice: true });
      return;
    case "transportNotice":
      acc.mergeTemplate({ showTransportNotice: true });
      return;
    case "transportDropIn":
      applyTransportDropInBlock(acc, block.options);
      return;
    case "breadcrumbs":
    case "custom":
      acc.warn(`Guide block "${block.type}" currently has no runtime handler`);
      return;
    default:
      acc.warn(`Unknown guide block type "${(block as { type: string }).type}"`);
  }
}

export function composeBlocks(entry: GuideManifestEntry): {
  template: TemplateFragment;
  warnings: string[];
} {
  const accumulator = new BlockAccumulator(entry);

  // Process explicit blocks
  for (const block of entry.blocks) {
    composeBlock(accumulator, block);
  }

  // GUIDE-XREF-01: Apply manifest.relatedGuides as default when no explicit relatedGuides block exists
  const template = accumulator.buildTemplate();
  const hasExplicitRelatedGuides = template.relatedGuides !== undefined;
  const hasManifestRelatedGuides = Array.isArray(entry.relatedGuides) && entry.relatedGuides.length > 0;

  if (!hasExplicitRelatedGuides && hasManifestRelatedGuides) {
    accumulator.mergeTemplate({
      relatedGuides: {
        items: entry.relatedGuides.map((key) => ({ key })),
      },
    });
  }

  return {
    template: accumulator.buildTemplate(),
    warnings: accumulator.warnings,
  };
}
