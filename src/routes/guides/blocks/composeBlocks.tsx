/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route helper under routes; head tags are defined by the route meta()/links() exports per src/routes/AGENTS.md §3 */
// src/routes/guides/blocks/composeBlocks.ts
// i18n-exempt file -- TECH-000 [ttl=2026-12-31] Non-UI helper; strings are developer metadata, module specifiers, or translation keys
import { BlockAccumulator, type TemplateFragment } from "./blockAccumulator";
import { applyAlsoHelpfulBlock } from "./renderers/alsoHelpfulBlock";
import { applyFaqBlock } from "./renderers/faqBlock";
import { applyGalleryBlock } from "./renderers/galleryBlock";
import { applyGenericContentBlock } from "./renderers/genericContentBlock";
import { applyHeroBlock } from "./renderers/heroBlock";
import { applyJsonLdBlock } from "./renderers/jsonLdBlock";
import { applyPlanChoiceBlock } from "./renderers/planChoiceBlock";
import { applyRelatedGuidesBlock } from "./renderers/relatedGuidesBlock";
import { applyServiceSchemaBlock } from "./renderers/serviceSchemaBlock";
import { applyTransportNoticeBlock } from "./renderers/transportNoticeBlock";

import type { GuideManifestEntry } from "../guide-manifest";
import type { GuideBlockDeclaration } from "./types";

type GuideBlockHandler<TBlock extends GuideBlockDeclaration = GuideBlockDeclaration> = (
  acc: BlockAccumulator,
  block: TBlock,
) => void;

type GuideBlockHandlerMap = {
  [Type in GuideBlockDeclaration["type"]]: GuideBlockHandler<Extract<GuideBlockDeclaration, { type: Type }>>;
};

const BLOCK_HANDLERS: GuideBlockHandlerMap = {
  hero: (acc, block) => applyHeroBlock(acc, block.options),
  genericContent: (acc, block) => applyGenericContentBlock(acc, block.options),
  faq: (acc, block) => applyFaqBlock(acc, block.options),
  gallery: (acc, block) => applyGalleryBlock(acc, block.options),
  serviceSchema: (acc, block) => applyServiceSchemaBlock(acc, block.options),
  alsoHelpful: (acc, block) => applyAlsoHelpfulBlock(acc, block.options),
  jsonLd: (acc, block) => applyJsonLdBlock(acc, block.options),
  relatedGuides: (acc, block) => applyRelatedGuidesBlock(acc, block.options),
  planChoice: (acc) => applyPlanChoiceBlock(acc),
  transportNotice: (acc) => applyTransportNoticeBlock(acc),
  breadcrumbs: (acc, block) => warnMissingRuntimeHandler(acc, block.type),
  custom: (acc, block) => warnMissingRuntimeHandler(acc, block.type),
};

const FALLBACK_BLOCK_HANDLER: GuideBlockHandler = (acc, block) => {
  const type = (block as { type?: string }).type ?? "unknown";
  acc.warn(`Unknown guide block type "${type}"`);
};

const BLOCK_HANDLER_REGISTRY = BLOCK_HANDLERS as Record<GuideBlockDeclaration["type"], GuideBlockHandler>;

function composeBlock(acc: BlockAccumulator, block: GuideBlockDeclaration): void {
  const handler = BLOCK_HANDLER_REGISTRY[block.type] ?? FALLBACK_BLOCK_HANDLER;
  handler(acc, block);
}

function warnMissingRuntimeHandler(acc: BlockAccumulator, type: GuideBlockDeclaration["type"]): void {
  acc.warn(`Guide block "${type}" currently has no runtime handler`);
}

export function composeBlocks(entry: GuideManifestEntry): {
  template: TemplateFragment;
  warnings: string[];
} {
  const accumulator = new BlockAccumulator(entry);
  for (const block of entry.blocks) {
    composeBlock(accumulator, block);
  }
  return {
    template: accumulator.buildTemplate(),
    warnings: accumulator.warnings,
  };
}
