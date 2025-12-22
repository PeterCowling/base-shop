// file path: src/locales/guides.peek.ts
// -----------------------------------------------------------------------------
// Peek at the cached guides bundle without cloning (internal reads only).
// -----------------------------------------------------------------------------

import type { GuidesNamespace } from "./guides.types";
import { getGuidesBundlesMap } from "./guides.state";

export function peekGuidesBundle(locale: string): GuidesNamespace | undefined {
  return getGuidesBundlesMap().get(locale);
}

