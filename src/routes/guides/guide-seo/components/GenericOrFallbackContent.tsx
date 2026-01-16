// src/routes/guides/guide-seo/components/GenericOrFallbackContent.tsx
/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route helper under routes; head tags come from the route file */
/* eslint-disable @acme/ds/no-hardcoded-copy -- DEV-000: Extracted from _GuideSeoTemplate for test parity. */
import { debugGuide } from "@/utils/debug";

import type { GenericOrFallbackContentProps } from "./genericOrFallback.types";
import { renderFallbackBlocks } from "./FallbackBlocks";
import { renderManualFallbackPreGeneric } from "./ManualFallbackBlock";
import { useGenericFallbackDecision } from "./hooks/useGenericFallbackDecision";
import { useGuideContentState } from "./hooks/useGuideContentState";

export default function GenericOrFallbackContent(
  props: GenericOrFallbackContentProps,
): JSX.Element | null {
  if (props.preferManualWhenUnlocalized && !props.hasLocalizedContent) {
    return null;
  }

  return <GenericOrFallbackContentInner {...props} />;
}

function GenericOrFallbackContentInner(
  props: GenericOrFallbackContentProps,
): JSX.Element | null {
  const { guideKey, hasLocalizedContent } = props;
  const lang = props.lang;

  const shared = useGuideContentState(props);
  const { localizedManualFallback } = shared;

  try {
    debugGuide("GenericContent localized manual fallback", {
      guideKey,
      lang,
      hasLocalizedContent,
      manualFallbackType:
        localizedManualFallback == null ? null : typeof localizedManualFallback,
    });
  } catch {
    /* noop */
  }

  const manualResult = renderManualFallbackPreGeneric(props, shared);
  const decision = useGenericFallbackDecision({
    props,
    shared,
    manualState: manualResult,
  });
  if (manualResult.shouldHalt) {
    return manualResult.element;
  }
  if (decision.handled) {
    return decision.node;
  }

  const fallbackResult = renderFallbackBlocks(props, shared, decision.hasStructured);
  if (fallbackResult) {
    return fallbackResult;
  }

  return null;
}