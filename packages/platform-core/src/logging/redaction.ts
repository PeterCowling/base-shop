/**
 * LAUNCH-08: Redaction utilities for sensitive data
 *
 * Provides pattern-based redaction of secrets, PII, and payment data.
 * Use these utilities to ensure sensitive data never appears in logs.
 */

// ============================================================
// Types
// ============================================================

export interface RedactorPattern {
  /** Pattern name for debugging */
  name: string;
  /** Regex pattern to match */
  pattern: RegExp;
  /** Replacement string (default: "[REDACTED]") */
  replacement?: string;
}

export interface RedactorConfig {
  /** Patterns to apply */
  patterns: RedactorPattern[];
  /** Keys to always redact (case-insensitive) */
  sensitiveKeys?: string[];
  /** Replacement string for key-based redaction */
  keyReplacement?: string;
  /** Whether to redact nested objects */
  deep?: boolean;
  /** Maximum depth for deep redaction */
  maxDepth?: number;
}

// ============================================================
// Default Patterns
// ============================================================

/**
 * Patterns for detecting secrets and API keys.
 */
export const DEFAULT_SECRET_PATTERNS: RedactorPattern[] = [
  // Stripe keys
  {
    name: "stripe-secret-key",
    pattern: /sk_(live|test)_[a-zA-Z0-9]{24,}/g,
    replacement: "[STRIPE_SECRET_KEY]",
  },
  {
    name: "stripe-restricted-key",
    pattern: /rk_(live|test)_[a-zA-Z0-9]{24,}/g,
    replacement: "[STRIPE_RESTRICTED_KEY]",
  },
  {
    name: "stripe-webhook-secret",
    pattern: /whsec_[a-zA-Z0-9]{24,}/g,
    replacement: "[STRIPE_WEBHOOK_SECRET]",
  },

  // AWS keys
  {
    name: "aws-access-key",
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: "[AWS_ACCESS_KEY]",
  },
  {
    name: "aws-secret-key",
    pattern: /[a-zA-Z0-9+/]{40}/g,
    replacement: "[AWS_SECRET_KEY]",
  },

  // GitHub tokens
  {
    name: "github-token",
    pattern: /gh[pousr]_[a-zA-Z0-9]{36,}/g,
    replacement: "[GITHUB_TOKEN]",
  },
  {
    name: "github-classic-token",
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    replacement: "[GITHUB_CLASSIC_TOKEN]",
  },

  // Generic API keys
  {
    name: "api-key-pattern",
    pattern: /[a-f0-9]{32,64}/gi,
    replacement: "[API_KEY]",
  },

  // JWT tokens
  {
    name: "jwt-token",
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: "[JWT_TOKEN]",
  },

  // Bearer tokens
  {
    name: "bearer-token",
    pattern: /Bearer\s+[a-zA-Z0-9._-]+/gi,
    replacement: "Bearer [REDACTED]",
  },

  // Base64 encoded secrets (common pattern)
  {
    name: "base64-secret",
    pattern: /[A-Za-z0-9+/]{50,}={0,2}/g,
    replacement: "[BASE64_SECRET]",
  },

  // Environment variable values that look like secrets
  {
    name: "secret-env-pattern",
    pattern: /(?:SECRET|KEY|TOKEN|PASSWORD|CREDENTIAL)[_=:]\s*['"]?[a-zA-Z0-9!@#$%^&*()_+=-]{8,}['"]?/gi,
    replacement: "[ENV_SECRET]",
  },
];

/**
 * Patterns for detecting PII (Personally Identifiable Information).
 */
export const DEFAULT_PII_PATTERNS: RedactorPattern[] = [
  // Email addresses
  {
    name: "email",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: "[EMAIL]",
  },

  // Phone numbers (international format)
  {
    name: "phone-international",
    pattern: /\+?[1-9]\d{1,14}/g,
    replacement: "[PHONE]",
  },

  // Social Security Numbers (US)
  {
    name: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN]",
  },

  // IP addresses
  {
    name: "ipv4",
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    replacement: "[IP_ADDRESS]",
  },
];

/**
 * Patterns for detecting payment data.
 */
export const DEFAULT_PAYMENT_PATTERNS: RedactorPattern[] = [
  // Credit card numbers (basic pattern - 13-19 digits with optional separators)
  {
    name: "credit-card",
    pattern: /\b(?:\d{4}[-\s]?){3,4}\d{1,4}\b/g,
    replacement: "[CARD_NUMBER]",
  },

  // CVV/CVC
  {
    name: "cvv",
    pattern: /\bCVV[:\s]*\d{3,4}\b/gi,
    replacement: "CVV: [REDACTED]",
  },

  // Expiry dates (MM/YY or MM/YYYY)
  {
    name: "card-expiry",
    pattern: /\b(?:0[1-9]|1[0-2])\/(?:\d{2}|\d{4})\b/g,
    replacement: "[CARD_EXPIRY]",
  },

  // Bank account numbers (basic pattern)
  {
    name: "bank-account",
    pattern: /\b\d{8,17}\b/g,
    replacement: "[BANK_ACCOUNT]",
  },

  // IBAN
  {
    name: "iban",
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
    replacement: "[IBAN]",
  },
];

/**
 * Keys that should always be redacted (case-insensitive).
 */
export const DEFAULT_SENSITIVE_KEYS: string[] = [
  "password",
  "passwd",
  "secret",
  "apikey",
  "api_key",
  "apiKey",
  "token",
  "accesstoken",
  "access_token",
  "accessToken",
  "refreshtoken",
  "refresh_token",
  "refreshToken",
  "authorization",
  "auth",
  "credential",
  "credentials",
  "private",
  "privatekey",
  "private_key",
  "privateKey",
  "ssn",
  "socialsecurity",
  "creditcard",
  "credit_card",
  "creditCard",
  "cardnumber",
  "card_number",
  "cardNumber",
  "cvv",
  "cvc",
  "pin",
  "bankaccount",
  "bank_account",
  "bankAccount",
  "routingnumber",
  "routing_number",
  "routingNumber",
  "webhooksecret",
  "webhook_secret",
  "webhookSecret",
  "signingsecret",
  "signing_secret",
  "signingSecret",
];

// ============================================================
// Core Redaction Functions
// ============================================================

/**
 * Redact sensitive data from a string using pattern matching.
 */
export function redact(
  input: string,
  patterns: RedactorPattern[] = DEFAULT_SECRET_PATTERNS
): string {
  let result = input;

  for (const { pattern, replacement } of patterns) {
    result = result.replace(pattern, replacement ?? "[REDACTED]");
  }

  return result;
}

/**
 * Redact sensitive keys from an object (shallow).
 */
export function redactObject<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys: string[] = DEFAULT_SENSITIVE_KEYS,
  replacement: string = "[REDACTED]"
): T {
  const result = { ...obj };
  const lowerKeys = sensitiveKeys.map((k) => k.toLowerCase());

  for (const key of Object.keys(result)) {
    if (lowerKeys.includes(key.toLowerCase())) {
      (result as Record<string, unknown>)[key] = replacement;
    }
  }

  return result;
}

/**
 * Deep redaction of objects with pattern matching on string values.
 */
export function redactDeep<T>(
  input: T,
  config: RedactorConfig = {
    patterns: DEFAULT_SECRET_PATTERNS,
    sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
    deep: true,
    maxDepth: 10,
  },
  currentDepth: number = 0
): T {
  const { patterns, sensitiveKeys, maxDepth } = config;
  const keyReplacement = config.keyReplacement ?? "[REDACTED]";
  const lowerSensitiveKeys = (sensitiveKeys ?? []).map((k) => k.toLowerCase());

  if (currentDepth > (maxDepth ?? 10)) {
    return input;
  }

  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return redact(input, patterns) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) =>
      redactDeep(item, config, currentDepth + 1)
    ) as T;
  }

  if (typeof input === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      // Check if key is sensitive
      if (lowerSensitiveKeys.includes(key.toLowerCase())) {
        result[key] = keyReplacement;
        continue;
      }

      // Recurse for nested objects
      result[key] = redactDeep(value, config, currentDepth + 1);
    }

    return result as T;
  }

  return input;
}

/**
 * Create a custom redactor with specific configuration.
 */
export function createRedactor(config: RedactorConfig) {
  return {
    /**
     * Redact a string value.
     */
    string: (input: string): string => redact(input, config.patterns),

    /**
     * Redact an object (shallow).
     */
    object: <T extends Record<string, unknown>>(obj: T): T =>
      redactObject(obj, config.sensitiveKeys, config.keyReplacement),

    /**
     * Redact an object deeply.
     */
    deep: <T>(input: T): T => redactDeep(input, config),
  };
}

// ============================================================
// Pre-configured Redactors
// ============================================================

/**
 * Redact secrets and API keys from a string or object.
 */
export const redactSecrets = createRedactor({
  patterns: DEFAULT_SECRET_PATTERNS,
  sensitiveKeys: DEFAULT_SENSITIVE_KEYS.filter((k) =>
    ["secret", "key", "token", "password", "credential", "auth", "private"].some(
      (s) => k.toLowerCase().includes(s)
    )
  ),
  deep: true,
});

/**
 * Redact PII from a string or object.
 */
export const redactPII = createRedactor({
  patterns: DEFAULT_PII_PATTERNS,
  sensitiveKeys: ["email", "phone", "address", "ssn", "name", "dob", "dateofbirth"],
  deep: true,
});

/**
 * Redact payment data from a string or object.
 */
export const redactPayment = createRedactor({
  patterns: DEFAULT_PAYMENT_PATTERNS,
  sensitiveKeys: [
    "cardnumber",
    "card_number",
    "cardNumber",
    "cvv",
    "cvc",
    "expiry",
    "bankaccount",
    "bank_account",
    "bankAccount",
    "iban",
    "routingnumber",
    "routing_number",
    "routingNumber",
  ],
  deep: true,
});

/**
 * Redact all sensitive data (secrets, PII, and payment).
 */
export const redactAll = createRedactor({
  patterns: [
    ...DEFAULT_SECRET_PATTERNS,
    ...DEFAULT_PII_PATTERNS,
    ...DEFAULT_PAYMENT_PATTERNS,
  ],
  sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
  deep: true,
});
