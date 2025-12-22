// src/utils/i18nSafe.ts
// Unified, safe helpers for i18n reads and common coercions.
// Re-exports stable utilities so call-sites avoid bespoke fallback logic.

import type { TFunction } from "i18next";

// Core fallback + translator helpers
export { getNamespaceTranslator, getStringWithFallback, getOptionalString } from "./translationFallbacks";

// Array coercion helpers
export { ensureStringArray, ensureArray } from "./i18nContent";

// Convenience type re-exports for consumers that need them
export type { TFunction };

