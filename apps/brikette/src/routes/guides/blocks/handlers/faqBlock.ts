/**
 * FAQ block handler.
 */
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { normalizeFaqEntries } from "@/utils/buildFaqJsonLd";

import type { FaqBlockOptions } from "../types";

import type { BlockAccumulator } from "./BlockAccumulator";

export function applyFaqBlock(acc: BlockAccumulator, options?: FaqBlockOptions): void {
  const fallbackKey = options?.fallbackKey ?? acc.manifest.contentKey;
  const fallback = (lang: string) => {
    const raw = getGuideResource<unknown>(lang, `content.${fallbackKey}.faqs`, { includeFallback: true });
    return normalizeFaqEntries(raw);
  };

  acc.mergeTemplate({
    guideFaqFallback: fallback,
    alwaysProvideFaqFallback: Boolean(options?.alwaysProvideFallback),
    ...(typeof options?.preferManualWhenUnlocalized === "boolean"
      ? { preferManualWhenUnlocalized: options.preferManualWhenUnlocalized }
      : {}),
    ...(typeof options?.suppressWhenUnlocalized === "boolean"
      ? { suppressFaqWhenUnlocalized: options.suppressWhenUnlocalized }
      : {}),
  });
}
