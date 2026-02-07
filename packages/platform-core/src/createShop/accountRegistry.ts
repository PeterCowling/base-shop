/**
 * Account Registry (LAUNCH-28)
 *
 * Centralized registry for shared provider accounts across shops.
 * Enables shops to use "director-approved" pre-configured accounts
 * for payment, shipping, and tax providers without needing individual
 * credentials per shop.
 *
 * Key concepts:
 * - Account: A configured provider account (e.g., Stripe account with credentials)
 * - Account Pool: A set of accounts available for shop allocation
 * - Allocation: Assignment of a shop to use a specific account
 */
import { z } from "zod";

// ============================================================
// Account Status
// ============================================================

export const accountStatusSchema = z.enum([
  "active", // Account is operational
  "pending", // Account awaiting verification/approval
  "suspended", // Temporarily disabled
  "deprecated", // Being phased out, no new allocations
]);

export type AccountStatus = z.infer<typeof accountStatusSchema>;

// ============================================================
// Account Registration Schema
// ============================================================

export const registeredAccountSchema = z.object({
  /** Unique account identifier (e.g., "acme-stripe-prod-01") */
  id: z.string().min(1),

  /** Provider this account is for (e.g., "stripe", "paypal", "dhl") */
  provider: z.string().min(1),

  /** Provider template ID this account implements */
  templateId: z.string().min(1),

  /** Human-readable label */
  label: z.string().min(1),

  /** Account status */
  status: accountStatusSchema.default("pending"),

  /** Environment this account is for */
  environment: z.enum(["dev", "staging", "prod"]),

  /** Region/market this account serves (ISO 3166-1 alpha-2 or "global") */
  region: z.string().default("global"),

  /** Supported currencies (empty = all supported by provider) */
  supportedCurrencies: z.array(z.string()).optional(),

  /** Maximum shops that can share this account (0 = unlimited) */
  maxAllocations: z.number().int().min(0).default(0),

  /** Current allocation count */
  currentAllocations: z.number().int().min(0).default(0),

  /** Director approval status */
  directorApproved: z.boolean().default(false),

  /** Date director approved this account */
  approvedAt: z.string().datetime().optional(),

  /** Who approved the account */
  approvedBy: z.string().optional(),

  /** Notes/comments about this account */
  notes: z.string().optional(),

  /** Metadata for provider-specific configuration */
  metadata: z.record(z.unknown()).optional(),

  /** Creation timestamp */
  createdAt: z.string().datetime(),

  /** Last update timestamp */
  updatedAt: z.string().datetime(),
});

export type RegisteredAccount = z.infer<typeof registeredAccountSchema>;

// ============================================================
// Account Allocation Schema
// ============================================================

export const accountAllocationSchema = z.object({
  /** Allocation ID */
  id: z.string().min(1),

  /** Shop ID this allocation is for */
  shopId: z.string().min(1),

  /** Account ID being allocated */
  accountId: z.string().min(1),

  /** Provider category (payment, shipping, tax) */
  category: z.enum(["payment", "shipping", "tax"]),

  /** Whether this is the primary account for this category */
  isPrimary: z.boolean().default(true),

  /** Allocation status */
  status: z.enum(["active", "pending", "revoked"]).default("pending"),

  /** Allocation timestamp */
  allocatedAt: z.string().datetime(),

  /** Who created this allocation */
  allocatedBy: z.string().optional(),

  /** Revocation timestamp if revoked */
  revokedAt: z.string().datetime().optional(),

  /** Reason for revocation */
  revocationReason: z.string().optional(),
});

export type AccountAllocation = z.infer<typeof accountAllocationSchema>;

// ============================================================
// Account Pool Schema (for grouping accounts)
// ============================================================

export const accountPoolSchema = z.object({
  /** Pool identifier */
  id: z.string().min(1),

  /** Pool name */
  name: z.string().min(1),

  /** Pool description */
  description: z.string().optional(),

  /** Provider category this pool serves */
  category: z.enum(["payment", "shipping", "tax"]),

  /** Accounts in this pool */
  accountIds: z.array(z.string()),

  /** Default account for new allocations */
  defaultAccountId: z.string().optional(),

  /** Whether pool is available for new shops */
  acceptingAllocations: z.boolean().default(true),
});

export type AccountPool = z.infer<typeof accountPoolSchema>;

// ============================================================
// Shop Account Configuration (for launch config)
// ============================================================

/**
 * Configuration for how a shop uses provider accounts.
 * Can reference centralized accounts or specify custom credentials.
 */
export const shopAccountConfigSchema = z.object({
  /** Payment account configuration */
  payment: z
    .union([
      // Use centralized account by ID
      z.object({
        type: z.literal("centralized"),
        accountId: z.string().min(1),
      }),
      // Use custom credentials (env vars)
      z.object({
        type: z.literal("custom"),
        templateId: z.string().min(1),
        // Env vars are specified separately, not stored in config
      }),
    ])
    .optional(),

  /** Shipping account configuration */
  shipping: z
    .union([
      z.object({
        type: z.literal("centralized"),
        accountId: z.string().min(1),
      }),
      z.object({
        type: z.literal("custom"),
        templateId: z.string().min(1),
      }),
      // Built-in flat-rate (no external account needed)
      z.object({
        type: z.literal("flat-rate"),
        domestic: z.number().min(0),
        international: z.number().min(0).optional(),
        freeThreshold: z.number().min(0).optional(),
      }),
    ])
    .optional(),

  /** Tax account configuration */
  tax: z
    .union([
      z.object({
        type: z.literal("centralized"),
        accountId: z.string().min(1),
      }),
      z.object({
        type: z.literal("custom"),
        templateId: z.string().min(1),
      }),
      // Manual tax configuration
      z.object({
        type: z.literal("manual"),
        defaultRate: z.number().min(0).max(100),
        regions: z.record(z.number().min(0).max(100)).optional(),
      }),
    ])
    .optional(),
});

export type ShopAccountConfig = z.infer<typeof shopAccountConfigSchema>;

// ============================================================
// Helper Functions
// ============================================================

/**
 * Check if an account can accept new allocations.
 */
export function canAllocate(account: RegisteredAccount): boolean {
  if (account.status !== "active") {
    return false;
  }
  if (!account.directorApproved) {
    return false;
  }
  if (
    account.maxAllocations > 0 &&
    account.currentAllocations >= account.maxAllocations
  ) {
    return false;
  }
  return true;
}

/**
 * Validate that a shop account config references valid accounts.
 * Returns errors if any referenced accounts don't exist or can't be allocated.
 */
export function validateShopAccountConfig(
  config: ShopAccountConfig,
  availableAccounts: RegisteredAccount[]
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  const accountMap = new Map(availableAccounts.map((a) => [a.id, a]));

  const checkCentralized = (
    category: string,
    accountId: string | undefined
  ) => {
    if (!accountId) return;
    const account = accountMap.get(accountId);
    if (!account) {
      errors.push(`${category}: Account not found: ${accountId}`);
      return;
    }
    if (!canAllocate(account)) {
      errors.push(
        `${category}: Account ${accountId} cannot accept allocations (status: ${account.status}, approved: ${account.directorApproved})`
      );
    }
  };

  if (config.payment?.type === "centralized") {
    checkCentralized("payment", config.payment.accountId);
  }
  if (config.shipping?.type === "centralized") {
    checkCentralized("shipping", config.shipping.accountId);
  }
  if (config.tax?.type === "centralized") {
    checkCentralized("tax", config.tax.accountId);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Get required environment variables for a shop account configuration.
 * Returns variables needed based on whether using centralized or custom accounts.
 */
export function getRequiredEnvVarsForConfig(
  config: ShopAccountConfig,
  templates: Array<{ id: string; requiredEnvVars: string[] }>
): string[] {
  const vars: string[] = [];
  const templateMap = new Map(templates.map((t) => [t.id, t.requiredEnvVars]));

  // Centralized accounts don't require env vars (managed externally)
  // Custom accounts require the template's env vars

  if (config.payment?.type === "custom") {
    const templateVars = templateMap.get(config.payment.templateId);
    if (templateVars) {
      vars.push(...templateVars);
    }
  }

  if (config.shipping?.type === "custom") {
    const templateVars = templateMap.get(config.shipping.templateId);
    if (templateVars) {
      vars.push(...templateVars);
    }
  }

  if (config.tax?.type === "custom") {
    const templateVars = templateMap.get(config.tax.templateId);
    if (templateVars) {
      vars.push(...templateVars);
    }
  }

  // Dedupe
  return [...new Set(vars)];
}
