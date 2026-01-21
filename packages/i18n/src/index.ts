// packages/i18n/src/index.ts
"use client";

export { fillLocales } from "./fillLocales.js";
export {
  // New locale system (I18N-PIPE-00)
  type ContentLocale,
  CONTENT_LOCALES,
  isContentLocale,
  isUiLocale,
  normalizeContentLocale,
  resolveContentLocale,
  resolveUiLocale,
  type UiLocale,
  UI_LOCALES,
  // Legacy (deprecated)
  assertLocales,
  type Locale,
  LOCALES,
  locales,
  resolveLocale,
} from "./locales.js";
export {
  type MultilingualField,
  parseMultilingualInput,
} from "./parseMultilingualInput.js";
export {
  default as TranslationsProvider,
  useTranslations,
} from "./Translations.js";
export { contentFallbackChain, fallbackChain } from "./fallbackChain.js";
export { resolveContentText, resolveText } from "./resolveText.js";

// I18N-PIPE-00b: Content filtering and tokenization
export {
  DEFAULT_MAX_STRING_LENGTH,
  extractLinkLabels,
  filterContent,
  filterContentBatch,
  looksLikeCreditCard,
  looksLikeSsn,
  needsTokenization,
  restoreLinkTokensWithTranslatedLabels,
  restoreTokens,
  scanForPii,
  tokenize,
  tokenizeHtmlTags,
  validateTokenPreservation,
  type ContentFilterOptions,
  type ContentFilterResult,
  type GlossaryTerm,
  type GlossaryTokenMetadata,
  type HtmlTagMetadata,
  type LinkTokenMetadata,
  type PiiScanResult,
  type PiiType,
  type RestorationResult,
  type Token,
  type TokenizationOptions,
  type TokenizationResult,
  type TokenMetadata,
  type TokenType,
  type ValidationError,
} from "./tokenization/index.js";
