 
/*
 * DEV-1823: Block composer relies on fallback strings pending locale coverage, and this helper file does not
 * represent a route module with direct SEO exports.
 */
// src/routes/guides/blocks/composeBlocks.ts

import type { GuideManifestEntry } from "../guide-manifest";
import type { GuideKey } from "@/routes.guides-helpers";
import { relatedGuidesByTags } from "@/utils/related";

import {
  applyAlsoHelpfulBlock,
  applyCalloutBlock,
  applyFaqBlock,
  applyGenericContentBlock,
  applyHeroBlock,
  applyJsonLdBlock,
  applyServiceSchemaBlock,
  applyTableBlock,
  applyTransportDropInBlock,
  BlockAccumulator,
  type TemplateFragment,
} from "./handlers";
import type { GuideBlockDeclaration } from "./types";

function mergeUniqueGuideKeys(primary: readonly GuideKey[], secondary: readonly GuideKey[]): GuideKey[] {
  const seen = new Set<GuideKey>();
  const merged: GuideKey[] = [];

  for (const key of primary) {
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(key);
  }

  for (const key of secondary) {
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(key);
  }

  return merged;
}

function resolveRelatedGuideKeys(entry: GuideManifestEntry, template: TemplateFragment): GuideKey[] {
  const baseItems = template.relatedGuides?.items ?? [];
  const baseKeys = baseItems.map((item) => item.key);

  const alsoHelpful = template.alsoHelpful;
  if (!alsoHelpful || !Array.isArray(alsoHelpful.tags) || alsoHelpful.tags.length === 0) {
    return baseKeys;
  }

  const excludeSet = new Set<GuideKey>();
  excludeSet.add(entry.key);
  for (const key of baseKeys) excludeSet.add(key);

  const excludeGuide = alsoHelpful.excludeGuide;
  if (Array.isArray(excludeGuide)) {
    for (const key of excludeGuide) excludeSet.add(key);
  } else if (excludeGuide) {
    excludeSet.add(excludeGuide);
  }

  const suggested = relatedGuidesByTags(alsoHelpful.tags, {
    exclude: Array.from(excludeSet),
    ...(alsoHelpful.section ? { section: alsoHelpful.section } : {}),
    limit: 3,
  });

  return mergeUniqueGuideKeys(baseKeys, suggested);
}

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
    case "callout":
      applyCalloutBlock(acc, block.options);
      return;
    case "table":
      applyTableBlock(acc, block.options);
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
  let template = accumulator.buildTemplate();
  const hasExplicitRelatedGuides = template.relatedGuides !== undefined;
  const hasManifestRelatedGuides = Array.isArray(entry.relatedGuides) && entry.relatedGuides.length > 0;

  if (!hasExplicitRelatedGuides && hasManifestRelatedGuides) {
    template = {
      ...template,
      relatedGuides: {
        items: entry.relatedGuides.map((key) => ({ key })),
      },
    };
  }

  // Unify "alsoHelpful" guide links into the RelatedGuides footer.
  // "alsoHelpful" is retained as a manifest authoring concept (tags/exclusions),
  // but it should not produce a separate non-inline guide link surface.
  const relatedGuideKeys = resolveRelatedGuideKeys(entry, template);
  if (relatedGuideKeys.length > 0) {
    template = {
      ...template,
      relatedGuides: {
        ...(template.relatedGuides ?? {}),
        items: relatedGuideKeys.map((key) => ({ key })),
      },
    };
  }

  if ("alsoHelpful" in template) {
    delete template.alsoHelpful;
  }

  return {
    template,
    warnings: accumulator.warnings,
  };
}
