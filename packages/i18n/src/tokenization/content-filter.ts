/**
 * I18N-PIPE-00b: Content filter combining tokenization, PII scanning, and validation
 *
 * This is the main entry point for filtering content before translation.
 * It orchestrates:
 * 1. String length validation
 * 2. PII scanning (blocking)
 * 3. Tokenization (preserving)
 */

import { scanForPii } from "./pii-scanner.js";
import { tokenize } from "./tokenizer.js";
import type {
  ContentFilterResult,
  TokenizationOptions,
  ValidationError,
} from "./types.js";

/**
 * Default maximum string length (10k characters).
 */
export const DEFAULT_MAX_STRING_LENGTH = 10_000;

/**
 * Options for content filtering.
 */
export interface ContentFilterOptions extends TokenizationOptions {
  /** Maximum allowed string length (default: 10000) */
  maxStringLength?: number;
  /** Whether to run PII scanner (default: true) */
  scanForPii?: boolean;
}

/**
 * Filter content for translation readiness.
 *
 * Returns a result indicating whether the content can be translated,
 * and if so, provides the tokenized version.
 */
export function filterContent(
  text: string,
  options: ContentFilterOptions = {}
): ContentFilterResult {
  const {
    maxStringLength = DEFAULT_MAX_STRING_LENGTH,
    scanForPii: shouldScanPii = true,
    ...tokenizationOptions
  } = options;

  const validationErrors: ValidationError[] = [];

  // Step 1: Validate string length
  if (text.length > maxStringLength) {
    validationErrors.push({
      code: "too_long",
      message: `String length ${text.length} exceeds maximum ${maxStringLength}`,
      context: {
        length: text.length,
        maxLength: maxStringLength,
      },
    });
  }

  // Step 2: Check for invalid UTF-8 (in JavaScript, strings are always valid UTF-16,
  // but we can check for surrogate pair issues)
  if (hasInvalidSurrogates(text)) {
    validationErrors.push({
      code: "invalid_utf8",
      message: "String contains invalid Unicode surrogate pairs",
    });
  }

  // Step 3: PII scanning
  const piiScan = shouldScanPii
    ? scanForPii(text)
    : { hasPii: false, piiTypes: [], blocked: false };

  if (piiScan.blocked) {
    validationErrors.push({
      code: "blocked_pii",
      message: `Content blocked due to detected PII: ${piiScan.blockReason}`,
      context: {
        piiTypes: piiScan.piiTypes,
        blockReason: piiScan.blockReason,
      },
    });
  }

  // If there are blocking errors, return early without tokenization
  const hasBlockingErrors = validationErrors.some(
    (e) => e.code === "blocked_pii" || e.code === "invalid_utf8"
  );

  if (hasBlockingErrors) {
    return {
      passed: false,
      piiScan,
      validationErrors,
    };
  }

  // Step 4: Tokenization
  const tokenization = tokenize(text, tokenizationOptions);

  // Step 5: Final validation - check for malformed markup that might cause issues
  const markupErrors = validateMarkup(text);
  validationErrors.push(...markupErrors);

  // Content passes if no blocking errors (length warning is non-blocking)
  const passed = !validationErrors.some(
    (e) =>
      e.code === "blocked_pii" ||
      e.code === "invalid_utf8" ||
      e.code === "malformed_markup"
  );

  return {
    passed,
    tokenization,
    piiScan,
    validationErrors,
  };
}

/**
 * Check for unpaired Unicode surrogate pairs.
 */
function hasInvalidSurrogates(text: string): boolean {
  // Check for lone surrogates (0xD800-0xDFFF range)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // High surrogate (0xD800-0xDBFF) should be followed by low surrogate (0xDC00-0xDFFF)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (isNaN(next) || next < 0xdc00 || next > 0xdfff) {
        return true;
      }
      i++; // Skip the low surrogate
    }
    // Lone low surrogate
    else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

/**
 * Validate markup for common issues that might cause translation problems.
 */
function validateMarkup(text: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for unclosed HTML tags (simple heuristic)
  const openTags: string[] = [];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let match;

  while ((match = tagPattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1].toLowerCase();

    // Skip self-closing tags and void elements
    const voidElements = new Set([
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ]);

    if (fullMatch.endsWith("/>") || voidElements.has(tagName)) {
      continue;
    }

    if (fullMatch.startsWith("</")) {
      // Closing tag
      const lastOpen = openTags.pop();
      if (lastOpen !== tagName) {
        // Mismatched tags - put back and record error
        if (lastOpen) openTags.push(lastOpen);
        errors.push({
          code: "malformed_markup",
          message: `Mismatched HTML tags: expected </${lastOpen}>, found </${tagName}>`,
          context: { expected: lastOpen, found: tagName },
        });
      }
    } else {
      // Opening tag
      openTags.push(tagName);
    }
  }

  // Check for unclosed tags
  if (openTags.length > 0) {
    errors.push({
      code: "malformed_markup",
      message: `Unclosed HTML tags: ${openTags.join(", ")}`,
      context: { unclosedTags: openTags },
    });
  }

  // Check for unclosed Brikette link patterns
  const linkPattern = /%LINK:[^%]*$/;
  if (linkPattern.test(text)) {
    errors.push({
      code: "malformed_markup",
      message: "Unclosed %LINK pattern",
    });
  }

  // Check for unmatched interpolation brackets
  const interpolationOpens = (text.match(/\{\{/g) || []).length;
  const interpolationCloses = (text.match(/\}\}/g) || []).length;
  if (interpolationOpens !== interpolationCloses) {
    errors.push({
      code: "malformed_markup",
      message: `Unbalanced i18next interpolation brackets: ${interpolationOpens} opens, ${interpolationCloses} closes`,
      context: { opens: interpolationOpens, closes: interpolationCloses },
    });
  }

  return errors;
}

/**
 * Quick check if content needs tokenization (has tokenizable patterns).
 * Useful for optimization - skip tokenization for plain text.
 */
export function needsTokenization(text: string): boolean {
  // Check for common tokenizable patterns
  const quickPatterns = [
    /@/, // Likely email
    /https?:\/\//, // URL
    /\{\{/, // i18next interpolation
    /\{[^}]+\}/, // Placeholder
    /%LINK:/, // Guide link
    /<[a-z]/i, // HTML tag
  ];

  return quickPatterns.some((pattern) => pattern.test(text));
}

/**
 * Batch filter multiple strings.
 * Returns results keyed by input index.
 */
export function filterContentBatch(
  texts: string[],
  options: ContentFilterOptions = {}
): Map<number, ContentFilterResult> {
  const results = new Map<number, ContentFilterResult>();

  for (let i = 0; i < texts.length; i++) {
    results.set(i, filterContent(texts[i], options));
  }

  return results;
}
