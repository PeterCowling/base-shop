/**
 * I18N-PIPE-00b: Content tokenization for translation pipeline
 *
 * Tokenizes preservable content before translation:
 * - Emails, URLs, phone numbers
 * - Placeholders: {name}, {{name}}, {0}
 * - Brikette guide links: %LINK:key|label%
 * - Glossary terms
 *
 * Token format: ⟦T<type><seq>⟧
 * - Unicode brackets U+27E6/U+27E7
 * - Type letter (U=URL, E=Email, etc.)
 * - 3-digit sequence number
 */

import type {
  GlossaryTerm,
  GlossaryTokenMetadata,
  HtmlTagMetadata,
  LinkTokenMetadata,
  RestorationResult,
  Token,
  TokenizationOptions,
  TokenizationResult,
  TokenType,
} from "./types.js";

// Token delimiters (Unicode mathematical brackets)
const TOKEN_OPEN = "⟦";
const TOKEN_CLOSE = "⟧";
const TOKEN_PREFIX = "T";

// Escape pattern for pre-existing tokens
const ESCAPE_OPEN = "⟦⟦";
const ESCAPE_CLOSE = "⟧⟧";

// Regex patterns for tokenizable content
const PATTERNS = {
  // URLs - matches http(s), ftp, and protocol-relative URLs
  url: /https?:\/\/[^\s<>"']+|ftp:\/\/[^\s<>"']+|\/\/[^\s<>"']+/g,

  // Emails - standard email pattern
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Phone numbers - international format, US format, and common variations
  phone:
    // eslint-disable-next-line security/detect-unsafe-regex -- digit groups and separators are fixed-width; used for tokenization only
    /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{2,4})?/g,

  // i18next interpolations: {{var}}, {{var, format}}
  i18nextInterpolation: /\{\{[^}]+\}\}/g,

  // ICU/generic placeholders: {var}, {0}, {name, type}
  icuPlaceholder: /\{[^{}]+\}/g,

  // Brikette guide links: %LINK:guideKey|visible label%
  guideLink: /%LINK:([^|]+)\|([^%]+)%/g,

  // Pre-existing token pattern (to escape)
  existingToken: /⟦T[A-Z]\d{3}⟧/g,
} as const;

/**
 * Build the token placeholder string.
 */
function buildTokenPlaceholder(type: TokenType, seq: number): string {
  const paddedSeq = String(seq).padStart(3, "0");
  return `${TOKEN_OPEN}${TOKEN_PREFIX}${type}${paddedSeq}${TOKEN_CLOSE}`;
}

/**
 * Parse a token placeholder string back to type and sequence.
 */

/**
 * Escape any pre-existing token-like patterns in the text.
 */
function escapeExistingTokens(text: string): {
  escaped: string;
  patterns: string[];
} {
  const patterns: string[] = [];
  const escaped = text.replace(PATTERNS.existingToken, (match) => {
    patterns.push(match);
    // Double the brackets to escape
    return match.replace(TOKEN_OPEN, ESCAPE_OPEN).replace(TOKEN_CLOSE, ESCAPE_CLOSE);
  });
  return { escaped, patterns };
}

/**
 * Unescape previously escaped token patterns.
 */
function unescapeTokens(text: string): string {
  return text
    .replace(/⟦⟦/g, TOKEN_OPEN)
    .replace(/⟧⟧/g, TOKEN_CLOSE);
}

/**
 * Tokenize a string, replacing preservable content with token placeholders.
 */
export function tokenize(
  text: string,
  options: TokenizationOptions = {}
): TokenizationResult {
  const {
    tokenizeUrls = true,
    tokenizeEmails = true,
    tokenizePhones = true,
    tokenizeI18nextInterpolations = true,
    tokenizePlaceholders = true,
    tokenizeGuideLinks = true,
    glossaryTerms = [],
  } = options;

  // Track tokens by type for sequence numbering
  const seqCounters: Record<TokenType, number> = {
    U: 0,
    E: 0,
    P: 0,
    I: 0,
    J: 0,
    H: 0,
    L: 0,
    G: 0,
    C: 0,
  };

  const tokenMap = new Map<string, Token>();

  // Step 1: Escape any pre-existing token patterns
  const { escaped, patterns: escapedPatterns } = escapeExistingTokens(text);
  let result = escaped;

  // Helper to add a token
  const addToken = (
    type: TokenType,
    original: string,
    metadata?: Token["metadata"]
  ): string => {
    seqCounters[type]++;
    const placeholder = buildTokenPlaceholder(type, seqCounters[type]);
    tokenMap.set(placeholder, {
      type,
      seq: seqCounters[type],
      original,
      metadata,
    });
    return placeholder;
  };

  // Step 2: Tokenize guide links first (they may contain other tokenizable content)
  if (tokenizeGuideLinks) {
    result = result.replace(PATTERNS.guideLink, (match, key, label) => {
      const metadata: LinkTokenMetadata = {
        type: "link",
        key: key.trim(),
        labelText: label.trim(),
      };
      return addToken("L", match, metadata);
    });
  }

  // Step 3: Tokenize URLs (before emails, as emails may be in URLs)
  if (tokenizeUrls) {
    result = result.replace(PATTERNS.url, (match) => addToken("U", match));
  }

  // Step 4: Tokenize emails
  if (tokenizeEmails) {
    result = result.replace(PATTERNS.email, (match) => addToken("E", match));
  }

  // Step 5: Tokenize i18next interpolations
  if (tokenizeI18nextInterpolations) {
    result = result.replace(PATTERNS.i18nextInterpolation, (match) =>
      addToken("I", match)
    );
  }

  // Step 6: Tokenize ICU/generic placeholders
  if (tokenizePlaceholders) {
    result = result.replace(PATTERNS.icuPlaceholder, (match) =>
      addToken("J", match)
    );
  }

  // Step 7: Tokenize phone numbers (last, as they're most likely to false-positive)
  if (tokenizePhones) {
    // Only match phone numbers that look like actual phone numbers
    // (not just any sequence of digits)
    result = result.replace(PATTERNS.phone, (match) => {
      // Skip if it's just digits without separators (likely not a phone)
      const hasPhoneFormat = /[+\-().\s]/.test(match) || match.length >= 10;
      if (!hasPhoneFormat) return match;
      return addToken("P", match);
    });
  }

  // Step 8: Tokenize glossary terms
  if (glossaryTerms.length > 0) {
    result = tokenizeGlossaryTerms(result, glossaryTerms, addToken);
  }

  return {
    tokenizedText: result,
    tokenMap,
    escapedPatterns,
    hasTokens: tokenMap.size > 0,
  };
}

/**
 * Tokenize glossary terms in the text.
 */
function tokenizeGlossaryTerms(
  text: string,
  terms: GlossaryTerm[],
  addToken: (
    type: TokenType,
    original: string,
    metadata?: Token["metadata"]
  ) => string
): string {
  let result = text;

  // Sort terms by length (longest first) to handle overlapping terms
  const sortedTerms = [...terms].sort(
    (a, b) => b.source.length - a.source.length
  );

  for (const term of sortedTerms) {
    const { source, translations, caseSensitive = false, matchWholeWord = true } =
      term;

    // Build regex for the term
    const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = caseSensitive ? "g" : "gi";
    let pattern: RegExp;
    if (matchWholeWord) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- `escapedSource` is regex-escaped above
      pattern = new RegExp(`\\b${escapedSource}\\b`, flags);
    } else {
      // eslint-disable-next-line security/detect-non-literal-regexp -- `escapedSource` is regex-escaped above
      pattern = new RegExp(escapedSource, flags);
    }

    result = result.replace(pattern, (match) => {
      const metadata: GlossaryTokenMetadata = {
        type: "glossary",
        sourceTerm: source,
        translations,
      };
      return addToken("G", match, metadata);
    });
  }

  return result;
}

/**
 * Restore tokens in a translated string.
 */
export function restoreTokens(
  translatedText: string,
  tokenMap: Map<string, Token>,
  targetLocale?: string
): RestorationResult {
  const restoredTokens: string[] = [];
  const failedTokens: string[] = [];

  // First, find all token placeholders in the translated text
  const tokenPattern = /⟦T[A-Z]\d{3}⟧/g;
  const foundTokens = new Set(translatedText.match(tokenPattern) || []);

  // Check for missing tokens
  for (const placeholder of tokenMap.keys()) {
    if (!foundTokens.has(placeholder)) {
      failedTokens.push(placeholder);
    }
  }

  // Restore tokens
  let result = translatedText.replace(tokenPattern, (placeholder) => {
    const token = tokenMap.get(placeholder);
    if (!token) {
      // Unknown token - this shouldn't happen but handle gracefully
      failedTokens.push(placeholder);
      return placeholder;
    }

    restoredTokens.push(placeholder);

    // Handle glossary tokens specially - may need locale-specific translation
    if (token.metadata?.type === "glossary") {
      const glossaryMeta = token.metadata as GlossaryTokenMetadata;
      if (targetLocale && glossaryMeta.translations?.[targetLocale]) {
        return glossaryMeta.translations[targetLocale];
      }
      // Fall back to original source term (protected from translation)
      return token.original;
    }

    // Handle link tokens - the label will be translated separately
    if (token.metadata?.type === "link") {
      const linkMeta = token.metadata as LinkTokenMetadata;
      // For now, restore with original label
      // The caller should handle label translation separately
      return `%LINK:${linkMeta.key}|${linkMeta.labelText}%`;
    }

    // For all other tokens, restore original value
    return token.original;
  });

  // Unescape any previously escaped token patterns
  result = unescapeTokens(result);

  return {
    restoredText: result,
    restoredTokens,
    failedTokens,
    success: failedTokens.length === 0,
  };
}

/**
 * Restore link tokens with translated labels.
 * Call this after translating the labels separately.
 */
export function restoreLinkTokensWithTranslatedLabels(
  text: string,
  tokenMap: Map<string, Token>,
  translatedLabels: Map<string, string>
): string {
  const tokenPattern = /⟦TL\d{3}⟧/g;

  return text.replace(tokenPattern, (placeholder) => {
    const token = tokenMap.get(placeholder);
    if (!token || token.metadata?.type !== "link") {
      return placeholder;
    }

    const linkMeta = token.metadata as LinkTokenMetadata;
    const translatedLabel =
      translatedLabels.get(linkMeta.labelText) || linkMeta.labelText;
    return `%LINK:${linkMeta.key}|${translatedLabel}%`;
  });
}

/**
 * Extract all unique link labels from a token map for batch translation.
 */
export function extractLinkLabels(tokenMap: Map<string, Token>): string[] {
  const labels = new Set<string>();

  for (const token of tokenMap.values()) {
    if (token.metadata?.type === "link") {
      const linkMeta = token.metadata as LinkTokenMetadata;
      labels.add(linkMeta.labelText);
    }
  }

  return Array.from(labels);
}

/**
 * Tokenize HTML tags for fallback handling when provider doesn't support HTML mode.
 */
export function tokenizeHtmlTags(
  text: string,
  addToken: (
    type: TokenType,
    original: string,
    metadata?: Token["metadata"]
  ) => string
): string {
  // Match HTML tags (opening, closing, and self-closing)
  // eslint-disable-next-line security/detect-unsafe-regex -- negated character classes avoid catastrophic backtracking
  const htmlTagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\s*([^>]*)?\/?>/g;

  return text.replace(htmlTagPattern, (match, tagName, attributes) => {
    const isClosing = match.startsWith("</");
    const isSelfClosing = match.endsWith("/>") || match.endsWith("/ >");

    const metadata: HtmlTagMetadata = {
      type: "html",
      tagName: tagName.toLowerCase(),
      tagType: isClosing ? "close" : isSelfClosing ? "self-closing" : "open",
      attributes: attributes?.trim() || undefined,
    };

    return addToken("H", match, metadata);
  });
}

/**
 * Validate that all tokens in the source are present in the translation.
 */
export function validateTokenPreservation(
  sourceTokenMap: Map<string, Token>,
  translatedText: string
): { valid: boolean; missingTokens: string[]; extraTokens: string[] } {
  const sourceTokens = new Set(sourceTokenMap.keys());
  const tokenPattern = /⟦T[A-Z]\d{3}⟧/g;
  const foundTokens = new Set(translatedText.match(tokenPattern) || []);

  const missingTokens: string[] = [];
  const extraTokens: string[] = [];

  // Check for missing tokens
  for (const token of sourceTokens) {
    if (!foundTokens.has(token)) {
      missingTokens.push(token);
    }
  }

  // Check for extra/unknown tokens
  for (const token of foundTokens) {
    if (!sourceTokens.has(token)) {
      extraTokens.push(token);
    }
  }

  return {
    valid: missingTokens.length === 0 && extraTokens.length === 0,
    missingTokens,
    extraTokens,
  };
}
