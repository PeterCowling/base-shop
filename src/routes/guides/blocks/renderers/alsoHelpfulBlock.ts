import type { GuideSection } from "@/data/guides.index";

import type { BlockAccumulator } from "../blockAccumulator";
import type { AlsoHelpfulBlockOptions } from "../types";

export function applyAlsoHelpfulBlock(acc: BlockAccumulator, options: AlsoHelpfulBlockOptions): void {
  const exclude = Array.isArray(options.excludeGuide)
    ? options.excludeGuide
    : options.excludeGuide
    ? [options.excludeGuide]
    : undefined;

  const config = {
    tags: options.tags,
    includeRooms: options.includeRooms,
    excludeGuide: exclude,
    titleKey: options.titleKey,
    section: options.section as GuideSection | undefined,
  };

  acc.mergeTemplate({
    alsoHelpful: config,
  });
}
