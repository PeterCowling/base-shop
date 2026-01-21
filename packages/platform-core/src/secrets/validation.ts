/**
 * LAUNCH-09: Secret Runtime Validation
 *
 * Utilities for validating secrets at runtime without exposing values.
 */

import {
  getRequiredSecretsForShop,
  getSecretDefinition,
  SECRET_REGISTRY,
  type SecretDefinition,
  type ShopSecretOverride,
} from "./registry";

// ============================================================
// Types
// ============================================================

/**
 * Secret validator function type.
 */
export interface SecretValidator {
  /** Validate a single secret */
  validate(name: string, value: string | undefined): boolean;
  /** Get validation errors for a secret */
  getErrors(name: string, value: string | undefined): string[];
  /** Check if a secret is present and non-empty */
  isPresent(name: string, value: string | undefined): boolean;
}

/**
 * Environment validation result.
 */
export interface EnvValidationResult {
  /** Whether all required secrets are valid */
  valid: boolean;
  /** Missing required secrets (names only, never values) */
  missing: string[];
  /** Invalid secrets (names and error messages, never values) */
  invalid: Array<{ name: string; errors: string[] }>;
  /** Placeholder values detected (names only) */
  placeholders: string[];
  /** Warnings (names only) */
  warnings: string[];
}

// ============================================================
// Validator
// ============================================================

/**
 * Create a secret validator with custom configuration.
 */
export function createSecretValidator(options: {
  /** Additional secret definitions to validate against */
  additionalSecrets?: SecretDefinition[];
  /** Custom placeholder patterns */
  placeholderPatterns?: RegExp[];
} = {}): SecretValidator {
  const { additionalSecrets = [], placeholderPatterns = [] } = options;

  const allSecrets = [...SECRET_REGISTRY, ...additionalSecrets];
  const defaultPlaceholderPatterns = [
    /^TODO_/i,
    /^__REPLACE_ME__$/i,
    /^placeholder$/i,
    /^CHANGEME$/i,
    /^xxx+$/i,
  ];
  const patterns = [...defaultPlaceholderPatterns, ...placeholderPatterns];

  const isPlaceholder = (value: string): boolean => {
    return patterns.some((p) => p.test(value));
  };

  return {
    validate(name: string, value: string | undefined): boolean {
      const definition = allSecrets.find((s) => s.name === name);
      if (!definition) return true; // Unknown secrets pass by default

      if (value === undefined || value === "") {
        return !definition.requiredForDeploy;
      }

      if (isPlaceholder(value)) {
        return false;
      }

      return definition.validationRules.every((rule) => rule.validate(value));
    },

    getErrors(name: string, value: string | undefined): string[] {
      const errors: string[] = [];
      const definition = allSecrets.find((s) => s.name === name);

      if (!definition) return errors;

      if (value === undefined || value === "") {
        if (definition.requiredForDeploy) {
          errors.push(`${name} is required but missing`);
        }
        return errors;
      }

      if (isPlaceholder(value)) {
        errors.push(`${name} contains a placeholder value`);
        return errors;
      }

      for (const rule of definition.validationRules) {
        if (!rule.validate(value)) {
          errors.push(`${name}: ${rule.errorMessage}`);
        }
      }

      return errors;
    },

    isPresent(name: string, value: string | undefined): boolean {
      return value !== undefined && value !== "" && !isPlaceholder(value);
    },
  };
}

// ============================================================
// Environment Validation
// ============================================================

/**
 * Validate environment secrets for a shop configuration.
 * Returns validation result without exposing actual secret values.
 */
export function validateEnvSecrets(
  env: Record<string, string | undefined>,
  shopConfig?: {
    paymentsProvider?: string;
    emailProvider?: string;
    cmsProvider?: string;
    sessionStore?: string;
  },
  overrides?: ShopSecretOverride
): EnvValidationResult {
  const result: EnvValidationResult = {
    valid: true,
    missing: [],
    invalid: [],
    placeholders: [],
    warnings: [],
  };

  const validator = createSecretValidator();

  // Get required secrets based on shop config
  const requiredSecrets = shopConfig
    ? getRequiredSecretsForShop(shopConfig, overrides)
    : SECRET_REGISTRY.filter((s) => s.requiredForDeploy);

  // Check each required secret
  for (const secret of requiredSecrets) {
    const value = env[secret.name];

    // Check if missing
    if (value === undefined || value === "") {
      result.missing.push(secret.name);
      result.valid = false;
      continue;
    }

    // Check for placeholders
    if (isPlaceholderValue(value)) {
      result.placeholders.push(secret.name);
      result.valid = false;
      continue;
    }

    // Validate value
    const errors = validator.getErrors(secret.name, value);
    if (errors.length > 0) {
      result.invalid.push({ name: secret.name, errors });
      result.valid = false;
    }
  }

  // Check for unknown secrets in env that might be typos
  const knownNames = new Set(SECRET_REGISTRY.map((s) => s.name));
  for (const name of Object.keys(env)) {
    if (name.endsWith("_KEY") || name.endsWith("_SECRET") || name.endsWith("_TOKEN")) {
      if (!knownNames.has(name)) {
        result.warnings.push(`Unknown secret-like variable: ${name}`);
      }
    }
  }

  return result;
}

/**
 * Check if a value is a placeholder.
 */
function isPlaceholderValue(value: string): boolean {
  const placeholderPatterns = [
    /^TODO_/i,
    /^__REPLACE_ME__$/i,
    /^placeholder$/i,
    /^CHANGEME$/i,
    /^xxx+$/i,
    /^your[_-]?.*[_-]?here$/i,
    /^insert[_-]?.*[_-]?here$/i,
  ];
  return placeholderPatterns.some((p) => p.test(value));
}

// ============================================================
// Redaction
// ============================================================

/**
 * Redact a secret value for safe logging.
 * Shows only the type/format hint, never the actual value.
 */
export function redactSecretValue(
  name: string,
  value: string | undefined
): string {
  if (value === undefined || value === "") {
    return "[empty]";
  }

  if (isPlaceholderValue(value)) {
    return "[placeholder]";
  }

  const definition = getSecretDefinition(name);
  if (!definition) {
    // Unknown secret - show basic info
    return `[${value.length} chars]`;
  }

  // Show format hint based on secret type
  if (name.includes("STRIPE") && value.startsWith("sk_")) {
    const prefix = value.startsWith("sk_live") ? "sk_live" : "sk_test";
    return `[${prefix}_***]`;
  }

  if (name.includes("STRIPE") && value.startsWith("pk_")) {
    const prefix = value.startsWith("pk_live") ? "pk_live" : "pk_test";
    return `[${prefix}_***]`;
  }

  if (name.includes("STRIPE") && value.startsWith("whsec_")) {
    return "[whsec_***]";
  }

  if (value.startsWith("SG.")) {
    return "[SG.***]";
  }

  if (value.startsWith("re_")) {
    return "[re_***]";
  }

  if (value.startsWith("AGE-SECRET-KEY-")) {
    return "[AGE-SECRET-KEY-***]";
  }

  if (value.includes("://")) {
    // URL - show protocol and host only
    try {
      const url = new URL(value);
      return `[${url.protocol}//${url.host}/***]`;
    } catch {
      return "[URL]";
    }
  }

  // Default - show length only
  return `[${value.length} chars]`;
}
