// src/routes/guides/blocks/index.ts
import type { GuideManifestEntry } from "../guide-manifest";
import type { GuideSeoTemplateProps } from "../guide-seo/types";
import { composeBlocks } from "./composeBlocks";

export type BlockTemplateResult = {
  template: Partial<GuideSeoTemplateProps>;
  warnings: string[];
};

export function buildBlockTemplate(entry: GuideManifestEntry): BlockTemplateResult {
  return composeBlocks(entry);
}

export { GUIDE_BLOCK_TYPES, type GuideBlockDeclaration, type GuideBlockType } from "./types";
