/**
 * Also helpful block handler.
 */
import type { GuideSection } from "@/data/guides.index";

import type { GuideSeoTemplateProps } from "../../guide-seo/types";
import type { AlsoHelpfulBlockOptions } from "../types";

import type { BlockAccumulator } from "./BlockAccumulator";

function normaliseGuideSection(value: unknown): GuideSection | undefined {
  if (value === "help" || value === "experiences") return value;
  return undefined;
}

export function applyAlsoHelpfulBlock(acc: BlockAccumulator, options: AlsoHelpfulBlockOptions): void {
  const exclude = Array.isArray(options.excludeGuide)
    ? options.excludeGuide
    : options.excludeGuide
      ? [options.excludeGuide]
      : undefined;

  if (!Array.isArray(options.tags) || options.tags.length === 0) {
    acc.warn("alsoHelpful block requires at least one tag");
    return;
  }

  const config: GuideSeoTemplateProps["alsoHelpful"] = {
    tags: [...options.tags],
  };

  if (Array.isArray(exclude)) {
    config.excludeGuide = [...exclude];
  }

  if (options.includeRooms != null) {
    config.includeRooms = options.includeRooms;
  }

  if (options.titleKey) {
    config.titleKey = options.titleKey;
  }

  const normalizedSection = normaliseGuideSection(options.section);
  if (normalizedSection) {
    config.section = normalizedSection;
  }

  acc.mergeTemplate({
    alsoHelpful: config,
  });
}
