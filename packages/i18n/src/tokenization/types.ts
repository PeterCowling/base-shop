/**
 * I18N-PIPE-00b: Tokenization types for content filtering
 *
 * Tokenization protects content that should not be translated:
 * - Emails, URLs, phone numbers
 * - Placeholders: {name}, {{name}}, {0}
 * - HTML tags (when using fallback mode)
 * - Brikette guide links: %LINK:key|label%
 */

/**
 * Token types used in the tokenization format.
 * Format: ⟦T<type><seq>⟧
 *
 * Examples:
 * - ⟦TU001⟧ = URL token #1
 * - ⟦TE002⟧ = Email token #2
 */
export type TokenType =
  | "U" // URL
  | "E" // Email
  | "P" // Phone number
  | "I" // i18next interpolation {{var}}
  | "J" // ICU/generic placeholder {var} or {0}
  | "H" // HTML tag
  | "L" // Link (%LINK:key|label%)
  | "G" // Glossary term
  | "C"; // Code block/span (Markdown)

/**
 * A single token entry in the token map.
 */
export interface Token {
  /** Token type identifier */
  type: TokenType;
  /** Sequence number (1-indexed, zero-padded to 3 digits) */
  seq: number;
  /** Original matched text that was replaced */
  original: string;
  /** Additional metadata depending on token type */
  metadata?: TokenMetadata;
}

/**
 * Metadata for specific token types.
 */
export type TokenMetadata =
  | LinkTokenMetadata
  | GlossaryTokenMetadata
  | HtmlTagMetadata;

/**
 * Metadata for %LINK:key|label% tokens.
 */
export interface LinkTokenMetadata {
  type: "link";
  /** Guide key (e.g., "fornilloBeachGuide") */
  key: string;
  /** Visible label text (to be translated separately) */
  labelText: string;
}

/**
 * Metadata for glossary term tokens.
 */
export interface GlossaryTokenMetadata {
  type: "glossary";
  /** Source term from glossary */
  sourceTerm: string;
  /** Optional locale-specific translations */
  translations?: Record<string, string>;
}

/**
 * Metadata for HTML tag tokens.
 */
export interface HtmlTagMetadata {
  type: "html";
  /** Tag name (e.g., "a", "strong") */
  tagName: string;
  /** Whether this is an opening, closing, or self-closing tag */
  tagType: "open" | "close" | "self-closing";
  /** Preserved attributes as string */
  attributes?: string;
}

/**
 * Result of tokenizing a string.
 */
export interface TokenizationResult {
  /** The tokenized text with placeholders */
  tokenizedText: string;
  /** Map of token placeholder to token data */
  tokenMap: Map<string, Token>;
  /** Any pre-existing token patterns that were escaped */
  escapedPatterns: string[];
  /** Whether the text contained any content to tokenize */
  hasTokens: boolean;
}

/**
 * Result of restoring tokens in a translated string.
 */
export interface RestorationResult {
  /** The restored text with original values or translations */
  restoredText: string;
  /** Tokens that were successfully restored */
  restoredTokens: string[];
  /** Tokens that were missing or mangled in the translated text */
  failedTokens: string[];
  /** Whether restoration was fully successful */
  success: boolean;
}

/**
 * Options for tokenization.
 */
export interface TokenizationOptions {
  /** Whether to tokenize URLs (default: true) */
  tokenizeUrls?: boolean;
  /** Whether to tokenize emails (default: true) */
  tokenizeEmails?: boolean;
  /** Whether to tokenize phone numbers (default: true) */
  tokenizePhones?: boolean;
  /** Whether to tokenize i18next interpolations {{var}} (default: true) */
  tokenizeI18nextInterpolations?: boolean;
  /** Whether to tokenize ICU/generic placeholders {var} (default: true) */
  tokenizePlaceholders?: boolean;
  /** Whether to tokenize %LINK:key|label% patterns (default: true) */
  tokenizeGuideLinks?: boolean;
  /** Glossary terms to tokenize (optional) */
  glossaryTerms?: GlossaryTerm[];
}

/**
 * A glossary term for tokenization.
 */
export interface GlossaryTerm {
  /** Source term to match */
  source: string;
  /** Optional translations per locale */
  translations?: Record<string, string>;
  /** Whether match is case-sensitive (default: false) */
  caseSensitive?: boolean;
  /** Whether to match whole words only (default: true) */
  matchWholeWord?: boolean;
}

/**
 * Result of PII scanning.
 */
export interface PiiScanResult {
  /** Whether PII was detected */
  hasPii: boolean;
  /** Types of PII found */
  piiTypes: PiiType[];
  /** Whether the string should be blocked from translation */
  blocked: boolean;
  /** Reason code if blocked */
  blockReason?: "ssn" | "credit_card" | "other_pii";
}

/**
 * Types of PII that can be detected.
 */
export type PiiType =
  | "ssn" // Social Security Number (US)
  | "credit_card" // Credit card number
  | "passport" // Passport number
  | "national_id"; // National ID patterns

/**
 * Result of content filtering (tokenization + PII scan + validation).
 */
export interface ContentFilterResult {
  /** Whether the content passed all filters */
  passed: boolean;
  /** Tokenization result (if passed) */
  tokenization?: TokenizationResult;
  /** PII scan result */
  piiScan: PiiScanResult;
  /** Validation errors */
  validationErrors: ValidationError[];
}

/**
 * A validation error during content filtering.
 */
export interface ValidationError {
  /** Error code */
  code: "too_long" | "invalid_utf8" | "blocked_pii" | "malformed_markup";
  /** Human-readable message */
  message: string;
  /** Additional context */
  context?: Record<string, unknown>;
}
