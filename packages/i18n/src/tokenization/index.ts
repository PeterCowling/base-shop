/**
 * I18N-PIPE-00b: Content filtering and tokenization module
 *
 * This module provides:
 * - Tokenization: Protect content that should not be translated
 * - PII scanning: Block content with sensitive data
 * - Content filtering: Combined validation pipeline
 */

// Main content filter entry point
export {
  DEFAULT_MAX_STRING_LENGTH,
  filterContent,
  filterContentBatch,
  needsTokenization,
  type ContentFilterOptions,
} from "./content-filter.js";

// PII scanner
export {
  looksLikeCreditCard,
  looksLikeSsn,
  scanForPii,
} from "./pii-scanner.js";

// Tokenization utilities
export {
  extractLinkLabels,
  restoreLinkTokensWithTranslatedLabels,
  restoreTokens,
  tokenize,
  tokenizeHtmlTags,
  validateTokenPreservation,
} from "./tokenizer.js";

// Types
export type {
  ContentFilterResult,
  GlossaryTerm,
  GlossaryTokenMetadata,
  HtmlTagMetadata,
  LinkTokenMetadata,
  PiiScanResult,
  PiiType,
  RestorationResult,
  Token,
  TokenizationOptions,
  TokenizationResult,
  TokenMetadata,
  TokenType,
  ValidationError,
} from "./types.js";
