// file path: src/locales/guides.peek.ts
// -----------------------------------------------------------------------------
// Peek at the cached guides bundle without cloning (internal reads only).
// -----------------------------------------------------------------------------

import { getGuidesBundlesMap } from "./guides.state";
import type { GuidesNamespace } from "./guides.types";

export function peekGuidesBundle(locale: string): GuidesNamespace | undefined {
  return getGuidesBundlesMap().get(locale);
}

