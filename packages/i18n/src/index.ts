// packages/i18n/src/index.ts
export { contentFallbackChain, fallbackChain } from "./fallbackChain.js";
export { fillLocales } from "./fillLocales.js";
export {
  // Legacy (deprecated)
  assertLocales,
  CONTENT_LOCALES,
  // New locale system (I18N-PIPE-00)
  type ContentLocale,
  isContentLocale,
  isUiLocale,
  type Locale,
  LOCALES,
  locales,
  normalizeContentLocale,
  resolveContentLocale,
  resolveLocale,
  resolveUiLocale,
  UI_LOCALES,
  type UiLocale,
} from "./locales.js";
export {
  type MultilingualField,
  parseMultilingualInput,
} from "./parseMultilingualInput.js";
export { resolveContentText, resolveText } from "./resolveText.js";
export {
  default as TranslationsProvider,
  useTranslations,
} from "./Translations.js";

// I18N-PIPE-00b: Content filtering and tokenization
export {
  type ContentFilterOptions,
  type ContentFilterResult,
  DEFAULT_MAX_STRING_LENGTH,
  extractLinkLabels,
  filterContent,
  filterContentBatch,
  type GlossaryTerm,
  type GlossaryTokenMetadata,
  type HtmlTagMetadata,
  type LinkTokenMetadata,
  looksLikeCreditCard,
  looksLikeSsn,
  needsTokenization,
  type PiiScanResult,
  type PiiType,
  type RestorationResult,
  restoreLinkTokensWithTranslatedLabels,
  restoreTokens,
  scanForPii,
  type Token,
  type TokenizationOptions,
  type TokenizationResult,
  tokenize,
  tokenizeHtmlTags,
  type TokenMetadata,
  type TokenType,
  validateTokenPreservation,
  type ValidationError,
} from "./tokenization/index.js";
