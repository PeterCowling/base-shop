/**
 * LAUNCH-09: Secret Registry
 *
 * Centralized definitions of all secrets used by the platform.
 * This is the single source of truth for secret metadata.
 */

import { randomBytes } from "node:crypto";

// ============================================================
// Types
// ============================================================

/**
 * Secret categories for organization and access control.
 */
export type SecretCategory =
  | "auth"
  | "payments"
  | "email"
  | "cms"
  | "storage"
  | "analytics"
  | "deploy"
  | "internal";

/**
 * Secret rotation policy.
 */
export interface SecretRotationPolicy {
  /** Whether rotation is required */
  required: boolean;
  /** Recommended rotation interval in days */
  intervalDays?: number;
  /** Whether automatic rotation is supported */
  autoRotateSupported?: boolean;
  /** Link to rotation documentation */
  rotationDocs?: string;
}

/**
 * Validation rule for a secret value.
 */
export interface SecretValidationRule {
  /** Rule name for error messages */
  name: string;
  /** Validation function */
  validate: (value: string) => boolean;
  /** Error message if validation fails */
  errorMessage: string;
}

/**
 * Complete definition of a secret.
 */
export interface SecretDefinition {
  /** Secret name (env var name) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Secret category */
  category: SecretCategory;
  /** Whether this secret is required for deployment */
  requiredForDeploy: boolean;
  /** Condition for requirement (e.g., "when PAYMENTS_PROVIDER=stripe") */
  condition?: string;
  /** Rotation policy */
  rotation: SecretRotationPolicy;
  /** Validation rules */
  validationRules: SecretValidationRule[];
  /** Example format (redacted) */
  exampleFormat?: string;
  /** Provider documentation link */
  providerDocs?: string;
  /** Can be auto-generated */
  canAutoGenerate?: boolean;
  /** Generation function (if auto-generatable) */
  generate?: () => string;
}

/**
 * Per-shop secret requirement.
 */
export interface SecretRequirement {
  /** Secret name */
  name: string;
  /** Whether required for this shop */
  required: boolean;
  /** Override value (for shop-specific secrets) */
  overrideValue?: string;
}

/**
 * Shop-specific secret overrides.
 */
export interface ShopSecretOverride {
  /** Shop ID */
  shopId: string;
  /** Secret requirements for this shop */
  requirements: SecretRequirement[];
}

/**
 * Deploy target types.
 */
export type DeployTarget = "cloudflare-pages" | "vercel" | "netlify" | "local";

/**
 * Secrets required per deploy target.
 */
export interface DeploySecretRequirements {
  /** Target type */
  target: DeployTarget;
  /** GitHub secrets needed for CI/CD */
  githubSecrets: string[];
  /** Provider-side secrets (Cloudflare env vars, Vercel env, etc.) */
  providerSecrets: string[];
  /** Runtime secrets (injected at runtime) */
  runtimeSecrets: string[];
}

/**
 * Secret validation result.
 */
export interface SecretValidationResult {
  /** Whether the secret is valid */
  valid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
}

// ============================================================
// Validation Rules
// ============================================================

const RULES = {
  minLength: (min: number): SecretValidationRule => ({
    name: `minLength(${min})`,
    validate: (v) => v.length >= min,
    errorMessage: `Must be at least ${min} characters`,
  }),

  maxLength: (max: number): SecretValidationRule => ({
    name: `maxLength(${max})`,
    validate: (v) => v.length <= max,
    errorMessage: `Must be at most ${max} characters`,
  }),

  pattern: (regex: RegExp, desc: string): SecretValidationRule => ({
    name: `pattern(${desc})`,
    validate: (v) => regex.test(v),
    errorMessage: `Must match pattern: ${desc}`,
  }),

  noPlaceholder: (): SecretValidationRule => ({
    name: "noPlaceholder",
    validate: (v) =>
      !/^(TODO_|__REPLACE_ME__|placeholder|CHANGEME|xxx+$)/i.test(v),
    errorMessage: "Cannot be a placeholder value",
  }),

  stripeSecretKey: (): SecretValidationRule => ({
    name: "stripeSecretKey",
    validate: (v) => /^sk_(live|test)_[a-zA-Z0-9]{24,}$/.test(v),
    errorMessage: "Must be a valid Stripe secret key (sk_live_* or sk_test_*)",
  }),

  stripePublishableKey: (): SecretValidationRule => ({
    name: "stripePublishableKey",
    validate: (v) => /^pk_(live|test)_[a-zA-Z0-9]{24,}$/.test(v),
    errorMessage:
      "Must be a valid Stripe publishable key (pk_live_* or pk_test_*)",
  }),

  stripeWebhookSecret: (): SecretValidationRule => ({
    name: "stripeWebhookSecret",
    validate: (v) => /^whsec_[a-zA-Z0-9]{24,}$/.test(v),
    errorMessage: "Must be a valid Stripe webhook secret (whsec_*)",
  }),

  url: (): SecretValidationRule => ({
    name: "url",
    validate: (v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: "Must be a valid URL",
  }),

  email: (): SecretValidationRule => ({
    name: "email",
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    errorMessage: "Must be a valid email address",
  }),
};

// ============================================================
// Secret Generation
// ============================================================

/**
 * Generate a cryptographically secure random secret.
 */
export function generateSecretValue(
  length: number = 32,
  encoding: "hex" | "base64" = "hex"
): string {
  const bytes = randomBytes(Math.ceil(length / 2));
  return encoding === "base64"
    ? bytes.toString("base64").slice(0, length)
    : bytes.toString("hex").slice(0, length);
}

/**
 * Generate a session secret (32+ chars, URL-safe).
 */
export function generateSessionSecret(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Generate a webhook secret (for non-Stripe webhooks).
 */
export function generateWebhookSecret(): string {
  return `whk_${randomBytes(24).toString("hex")}`;
}

// ============================================================
// Secret Registry
// ============================================================

/**
 * Complete registry of all platform secrets.
 */
export const SECRET_REGISTRY: SecretDefinition[] = [
  // ==========================================================
  // Authentication Secrets
  // ==========================================================
  {
    name: "NEXTAUTH_SECRET",
    description: "NextAuth.js session encryption secret",
    category: "auth",
    requiredForDeploy: true,
    rotation: {
      required: true,
      intervalDays: 90,
      autoRotateSupported: false,
      rotationDocs:
        "https://next-auth.js.org/configuration/options#secret",
    },
    validationRules: [RULES.noPlaceholder(), RULES.minLength(32)],
    exampleFormat: "32+ character random string",
    canAutoGenerate: true,
    generate: generateSessionSecret,
  },
  {
    name: "SESSION_SECRET",
    description: "Session cookie signing secret",
    category: "auth",
    requiredForDeploy: true,
    rotation: {
      required: true,
      intervalDays: 90,
      autoRotateSupported: false,
    },
    validationRules: [RULES.noPlaceholder(), RULES.minLength(32)],
    exampleFormat: "32+ character random string",
    canAutoGenerate: true,
    generate: generateSessionSecret,
  },
  {
    name: "CART_COOKIE_SECRET",
    description: "Cart cookie encryption secret",
    category: "auth",
    requiredForDeploy: true,
    rotation: {
      required: true,
      intervalDays: 180,
      autoRotateSupported: false,
    },
    validationRules: [RULES.noPlaceholder(), RULES.minLength(32)],
    exampleFormat: "32+ character random string",
    canAutoGenerate: true,
    generate: generateSessionSecret,
  },

  // ==========================================================
  // Payment Secrets
  // ==========================================================
  {
    name: "STRIPE_SECRET_KEY",
    description: "Stripe secret API key for server-side operations",
    category: "payments",
    requiredForDeploy: true,
    condition: "when PAYMENTS_PROVIDER=stripe",
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: true,
      rotationDocs: "https://stripe.com/docs/keys#rotating-keys",
    },
    validationRules: [RULES.noPlaceholder(), RULES.stripeSecretKey()],
    exampleFormat: "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://stripe.com/docs/api/authentication",
  },
  {
    name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    description: "Stripe publishable key for client-side Stripe.js",
    category: "payments",
    requiredForDeploy: true,
    condition: "when PAYMENTS_PROVIDER=stripe",
    rotation: {
      required: false,
      rotationDocs: "https://stripe.com/docs/keys",
    },
    validationRules: [RULES.noPlaceholder(), RULES.stripePublishableKey()],
    exampleFormat: "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://stripe.com/docs/api/authentication",
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    description: "Stripe webhook signing secret",
    category: "payments",
    requiredForDeploy: true,
    condition: "when PAYMENTS_PROVIDER=stripe",
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: true,
      rotationDocs: "https://stripe.com/docs/webhooks/signatures",
    },
    validationRules: [RULES.noPlaceholder(), RULES.stripeWebhookSecret()],
    exampleFormat: "whsec_xxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://stripe.com/docs/webhooks/signatures",
  },

  // ==========================================================
  // Storage Secrets
  // ==========================================================
  {
    name: "UPSTASH_REDIS_REST_URL",
    description: "Upstash Redis REST API URL",
    category: "storage",
    requiredForDeploy: true,
    condition: "when using Redis session/rate limiting",
    rotation: {
      required: false,
    },
    validationRules: [RULES.noPlaceholder(), RULES.url()],
    exampleFormat: "https://xxx-xxx.upstash.io",
    providerDocs: "https://upstash.com/docs/redis/overall/getstarted",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    description: "Upstash Redis REST API token",
    category: "storage",
    requiredForDeploy: true,
    condition: "when using Redis session/rate limiting",
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: true,
      rotationDocs: "https://upstash.com/docs/redis/overall/getstarted",
    },
    validationRules: [RULES.noPlaceholder(), RULES.minLength(20)],
    exampleFormat: "AXxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://upstash.com/docs/redis/overall/getstarted",
  },
  {
    name: "DATABASE_URL",
    description: "PostgreSQL connection string",
    category: "storage",
    requiredForDeploy: false,
    condition: "when using Prisma backend",
    rotation: {
      required: true,
      intervalDays: 90,
      autoRotateSupported: false,
    },
    validationRules: [
      RULES.noPlaceholder(),
      RULES.pattern(/^postgres(ql)?:\/\//, "PostgreSQL URL"),
    ],
    exampleFormat: "postgresql://user:pass@host:5432/db",
    providerDocs:
      "https://www.prisma.io/docs/concepts/database-connectors/postgresql",
  },

  // ==========================================================
  // Email Secrets
  // ==========================================================
  {
    name: "EMAIL_FROM",
    description: "Default sender email address",
    category: "email",
    requiredForDeploy: true,
    condition: "when email provider is configured",
    rotation: {
      required: false,
    },
    validationRules: [RULES.noPlaceholder(), RULES.email()],
    exampleFormat: "noreply@example.com",
  },
  {
    name: "SENDGRID_API_KEY",
    description: "SendGrid API key for email delivery",
    category: "email",
    requiredForDeploy: true,
    condition: "when EMAIL_PROVIDER=sendgrid",
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: true,
      rotationDocs: "https://docs.sendgrid.com/ui/account-and-settings/api-keys",
    },
    validationRules: [
      RULES.noPlaceholder(),
      RULES.pattern(/^SG\./, "SendGrid API key"),
    ],
    exampleFormat: "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://docs.sendgrid.com/for-developers/sending-email/api-getting-started",
  },
  {
    name: "RESEND_API_KEY",
    description: "Resend API key for email delivery",
    category: "email",
    requiredForDeploy: true,
    condition: "when EMAIL_PROVIDER=resend",
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: true,
      rotationDocs: "https://resend.com/docs/api-reference/api-keys",
    },
    validationRules: [
      RULES.noPlaceholder(),
      RULES.pattern(/^re_/, "Resend API key"),
    ],
    exampleFormat: "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://resend.com/docs/api-reference/api-keys",
  },

  // ==========================================================
  // CMS Secrets
  // ==========================================================
  {
    name: "SANITY_PROJECT_ID",
    description: "Sanity.io project ID",
    category: "cms",
    requiredForDeploy: true,
    condition: "when using Sanity CMS",
    rotation: {
      required: false,
    },
    validationRules: [
      RULES.noPlaceholder(),
      RULES.pattern(/^[a-z0-9]{8}$/, "Sanity project ID"),
    ],
    exampleFormat: "xxxxxxxx",
    providerDocs: "https://www.sanity.io/docs/api-versioning",
  },
  {
    name: "SANITY_DATASET",
    description: "Sanity.io dataset name",
    category: "cms",
    requiredForDeploy: true,
    condition: "when using Sanity CMS",
    rotation: {
      required: false,
    },
    validationRules: [
      RULES.noPlaceholder(),
      RULES.pattern(/^[a-z0-9_-]+$/, "Sanity dataset name"),
    ],
    exampleFormat: "production",
    providerDocs: "https://www.sanity.io/docs/datasets",
  },
  {
    name: "SANITY_API_TOKEN",
    description: "Sanity.io API token for write operations",
    category: "cms",
    requiredForDeploy: true,
    condition: "when using Sanity CMS with write access",
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: true,
      rotationDocs: "https://www.sanity.io/docs/http-auth",
    },
    validationRules: [RULES.noPlaceholder(), RULES.minLength(100)],
    exampleFormat: "sk...",
    providerDocs: "https://www.sanity.io/docs/http-auth",
  },

  // ==========================================================
  // Deploy Secrets
  // ==========================================================
  {
    name: "CLOUDFLARE_ACCOUNT_ID",
    description: "Cloudflare account ID for Pages deployment",
    category: "deploy",
    requiredForDeploy: true,
    rotation: {
      required: false,
    },
    validationRules: [
      RULES.noPlaceholder(),
      RULES.pattern(/^[a-f0-9]{32}$/, "Cloudflare account ID"),
    ],
    exampleFormat: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/",
  },
  {
    name: "CLOUDFLARE_API_TOKEN",
    description: "Cloudflare API token with Pages deployment permissions",
    category: "deploy",
    requiredForDeploy: true,
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: true,
      rotationDocs: "https://developers.cloudflare.com/fundamentals/api/get-started/create-token/",
    },
    validationRules: [RULES.noPlaceholder(), RULES.minLength(40)],
    exampleFormat: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://developers.cloudflare.com/fundamentals/api/get-started/create-token/",
  },
  {
    name: "TURBO_TOKEN",
    description: "Turborepo remote cache token",
    category: "deploy",
    requiredForDeploy: false,
    rotation: {
      required: false,
    },
    validationRules: [RULES.noPlaceholder()],
    providerDocs: "https://turbo.build/repo/docs/ci/github-actions#remote-caching",
  },
  {
    name: "SOPS_AGE_KEY",
    description: "Age private key for SOPS decryption",
    category: "deploy",
    requiredForDeploy: true,
    rotation: {
      required: true,
      intervalDays: 365,
      autoRotateSupported: false,
      rotationDocs: "https://github.com/getsops/sops#key-rotation",
    },
    validationRules: [
      RULES.noPlaceholder(),
      RULES.pattern(/^AGE-SECRET-KEY-/, "age private key"),
    ],
    exampleFormat: "AGE-SECRET-KEY-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    providerDocs: "https://github.com/FiloSottile/age",
  },
];

// ============================================================
// Deploy Target Requirements
// ============================================================

/**
 * Secrets required per deploy target.
 */
export const DEPLOY_SECRET_REQUIREMENTS: DeploySecretRequirements[] = [
  {
    target: "cloudflare-pages",
    githubSecrets: [
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "TURBO_TOKEN",
      "SOPS_AGE_KEY",
    ],
    providerSecrets: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXTAUTH_SECRET",
      "SESSION_SECRET",
      "CART_COOKIE_SECRET",
    ],
    runtimeSecrets: [
      "DATABASE_URL",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ],
  },
  {
    target: "vercel",
    githubSecrets: ["VERCEL_TOKEN", "TURBO_TOKEN", "SOPS_AGE_KEY"],
    providerSecrets: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXTAUTH_SECRET",
      "SESSION_SECRET",
      "CART_COOKIE_SECRET",
    ],
    runtimeSecrets: [
      "DATABASE_URL",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ],
  },
  {
    target: "netlify",
    githubSecrets: ["NETLIFY_AUTH_TOKEN", "TURBO_TOKEN", "SOPS_AGE_KEY"],
    providerSecrets: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXTAUTH_SECRET",
      "SESSION_SECRET",
      "CART_COOKIE_SECRET",
    ],
    runtimeSecrets: [
      "DATABASE_URL",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ],
  },
  {
    target: "local",
    githubSecrets: [],
    providerSecrets: [],
    runtimeSecrets: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXTAUTH_SECRET",
      "SESSION_SECRET",
      "CART_COOKIE_SECRET",
    ],
  },
];

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get secret definition by name.
 */
export function getSecretDefinition(name: string): SecretDefinition | undefined {
  return SECRET_REGISTRY.find((s) => s.name === name);
}

/**
 * Get all secrets in a category.
 */
export function getSecretsByCategory(category: SecretCategory): SecretDefinition[] {
  return SECRET_REGISTRY.filter((s) => s.category === category);
}

/**
 * Get required secrets for a shop based on its configuration.
 */
export function getRequiredSecretsForShop(
  shopConfig: {
    paymentsProvider?: string;
    emailProvider?: string;
    cmsProvider?: string;
    sessionStore?: string;
  },
  overrides?: ShopSecretOverride
): SecretDefinition[] {
  const required: SecretDefinition[] = [];

  for (const secret of SECRET_REGISTRY) {
    if (!secret.requiredForDeploy) continue;

    // Check conditions
    if (secret.condition) {
      const match = secret.condition.match(/when (\w+)=(\w+)/);
      if (match) {
        const [, condVar, condVal] = match;
        const configValue =
          condVar === "PAYMENTS_PROVIDER"
            ? shopConfig.paymentsProvider
            : condVar === "EMAIL_PROVIDER"
              ? shopConfig.emailProvider
              : condVar === "CMS_PROVIDER"
                ? shopConfig.cmsProvider
                : undefined;

        if (configValue !== condVal) {
          continue; // Condition not met
        }
      }
    }

    // Check overrides
    if (overrides) {
      const override = overrides.requirements.find((r) => r.name === secret.name);
      if (override && !override.required) {
        continue; // Explicitly not required for this shop
      }
    }

    required.push(secret);
  }

  return required;
}

/**
 * Get required secrets for a deploy target.
 */
export function getRequiredSecretsForDeploy(
  target: DeployTarget
): DeploySecretRequirements | undefined {
  return DEPLOY_SECRET_REQUIREMENTS.find((r) => r.target === target);
}

/**
 * Validate a single secret value.
 */
export function validateSecret(
  name: string,
  value: string | undefined
): SecretValidationResult {
  const result: SecretValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const definition = getSecretDefinition(name);
  if (!definition) {
    result.warnings.push(`Unknown secret: ${name}`);
    return result;
  }

  if (value === undefined || value === "") {
    if (definition.requiredForDeploy) {
      result.valid = false;
      result.errors.push(`${name} is required but missing`);
    }
    return result;
  }

  // Run validation rules
  for (const rule of definition.validationRules) {
    if (!rule.validate(value)) {
      result.valid = false;
      result.errors.push(`${name}: ${rule.errorMessage}`);
    }
  }

  return result;
}

/**
 * Validate multiple secrets.
 */
export function validateSecrets(
  secrets: Record<string, string | undefined>
): SecretValidationResult {
  const result: SecretValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const [name, value] of Object.entries(secrets)) {
    const secretResult = validateSecret(name, value);
    if (!secretResult.valid) {
      result.valid = false;
    }
    result.errors.push(...secretResult.errors);
    result.warnings.push(...secretResult.warnings);
  }

  return result;
}

/**
 * Validate all required secrets for a shop.
 */
export function validateShopSecrets(
  shopConfig: {
    paymentsProvider?: string;
    emailProvider?: string;
    cmsProvider?: string;
    sessionStore?: string;
  },
  secrets: Record<string, string | undefined>,
  overrides?: ShopSecretOverride
): SecretValidationResult {
  const result: SecretValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const required = getRequiredSecretsForShop(shopConfig, overrides);

  for (const secret of required) {
    const value = secrets[secret.name];
    const secretResult = validateSecret(secret.name, value);
    if (!secretResult.valid) {
      result.valid = false;
    }
    result.errors.push(...secretResult.errors);
    result.warnings.push(...secretResult.warnings);
  }

  return result;
}

/**
 * Check if a secret is approaching expiration based on rotation policy.
 */
export function isSecretExpiring(
  secretName: string,
  lastRotatedDate?: Date,
  warningDays: number = 30
): boolean {
  const definition = getSecretDefinition(secretName);
  if (!definition || !definition.rotation.required) {
    return false;
  }

  if (!lastRotatedDate || !definition.rotation.intervalDays) {
    return true; // Unknown rotation date = treat as expiring
  }

  const expirationDate = new Date(lastRotatedDate);
  expirationDate.setDate(
    expirationDate.getDate() + definition.rotation.intervalDays
  );

  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + warningDays);

  return expirationDate <= warningDate;
}

/**
 * Get all secrets that are approaching expiration.
 */
export function getExpiringSecrets(
  rotationDates: Record<string, Date | undefined>,
  warningDays: number = 30
): Array<{ name: string; definition: SecretDefinition; daysUntilExpiry?: number }> {
  const expiring: Array<{
    name: string;
    definition: SecretDefinition;
    daysUntilExpiry?: number;
  }> = [];

  for (const secret of SECRET_REGISTRY) {
    if (!secret.rotation.required) continue;

    const lastRotated = rotationDates[secret.name];
    if (isSecretExpiring(secret.name, lastRotated, warningDays)) {
      let daysUntilExpiry: number | undefined;
      if (lastRotated && secret.rotation.intervalDays) {
        const expirationDate = new Date(lastRotated);
        expirationDate.setDate(
          expirationDate.getDate() + secret.rotation.intervalDays
        );
        daysUntilExpiry = Math.ceil(
          (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      }

      expiring.push({
        name: secret.name,
        definition: secret,
        daysUntilExpiry,
      });
    }
  }

  return expiring;
}
