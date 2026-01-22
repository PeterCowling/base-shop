/**
 * LAUNCH-17: Webhook Registration Step
 *
 * Registers Stripe webhook endpoints for newly launched shops.
 * Integrates the register-stripe-webhook CLI into the launch pipeline.
 */

import Stripe from "stripe";

import {
  createEndpoint,
  DEFAULT_WEBHOOK_EVENTS,
  findExistingEndpoint,
  updateEndpoint,
} from "../../register-stripe-webhook";

// ============================================================
// Types
// ============================================================

export interface WebhookRegistrationOptions {
  /** Shop identifier */
  shopId: string;
  /** Deployed shop URL */
  deployUrl: string;
  /** Stripe secret key (from env or secrets) */
  stripeSecretKey?: string;
  /** Whether to update existing endpoint */
  updateExisting?: boolean;
  /** Whether this is a dry run */
  dryRun?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

export interface WebhookRegistrationResult {
  /** Whether registration succeeded */
  success: boolean;
  /** Action taken */
  action: "created" | "updated" | "skipped" | "failed";
  /** Webhook endpoint ID */
  endpointId?: string;
  /** Webhook signing secret (only on create) */
  webhookSecret?: string;
  /** Webhook URL */
  webhookUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Warning messages */
  warnings: string[];
}

// ============================================================
// Constants
// ============================================================

/** Stripe API version */
const STRIPE_API_VERSION = "2025-06-30.basil" as const;

/** Default webhook path */
const DEFAULT_WEBHOOK_PATH = "/api/stripe-webhook";

// ============================================================
// Webhook Registration
// ============================================================

/**
 * Build the webhook URL for a shop.
 */
export function buildWebhookUrl(deployUrl: string, path?: string): string {
  const url = new URL(path || DEFAULT_WEBHOOK_PATH, deployUrl);
  return url.toString();
}

/**
 * Register or update Stripe webhook for a launched shop.
 */
export async function registerShopWebhook(
  options: WebhookRegistrationOptions
): Promise<WebhookRegistrationResult> {
  const warnings: string[] = [];

  // Get Stripe key from environment if not provided
  const stripeKey = options.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return {
      success: false,
      action: "skipped",
      warnings: ["Stripe secret key not available - webhook registration skipped"],
    };
  }

  // Validate deploy URL
  if (!options.deployUrl) {
    return {
      success: false,
      action: "skipped",
      warnings: ["Deploy URL not available - webhook registration skipped"],
    };
  }

  const webhookUrl = buildWebhookUrl(options.deployUrl);

  // Warn if not HTTPS (but don't fail - might be local dev)
  if (!webhookUrl.startsWith("https://")) {
    warnings.push(
      `Webhook URL uses HTTP (${webhookUrl}). HTTPS recommended for production.`
    );
  }

  if (options.dryRun) {
    console.log(`[webhook] Dry run: Would register webhook for ${options.shopId}`);
    console.log(`[webhook]   URL: ${webhookUrl}`);
    console.log(`[webhook]   Events: ${DEFAULT_WEBHOOK_EVENTS.length} event types`);
    return {
      success: true,
      action: "skipped",
      webhookUrl,
      warnings: ["Dry run - no webhook registered"],
    };
  }

  try {
    // Create Stripe client
    const stripe = new Stripe(stripeKey, {
      apiVersion: STRIPE_API_VERSION,
    });

    // Check for existing endpoint
    const existing = await findExistingEndpoint(stripe, options.shopId, webhookUrl);

    if (existing) {
      if (options.updateExisting) {
        // Update existing endpoint
        if (options.verbose) {
          console.log(`[webhook] Updating existing endpoint: ${existing.id}`);
        }

        const updated = await updateEndpoint(
          stripe,
          existing.id,
          options.shopId,
          webhookUrl,
          [...DEFAULT_WEBHOOK_EVENTS]
        );

        console.log(`[webhook] Updated webhook endpoint: ${updated.id}`);
        console.log(`[webhook]   URL: ${updated.url}`);

        return {
          success: true,
          action: "updated",
          endpointId: updated.id,
          webhookUrl: updated.url,
          warnings,
        };
      } else {
        // Endpoint exists, skip
        if (options.verbose) {
          console.log(`[webhook] Endpoint already exists: ${existing.id}`);
        }

        warnings.push(
          `Webhook endpoint already exists for shop "${options.shopId}" (${existing.id})`
        );

        return {
          success: true,
          action: "skipped",
          endpointId: existing.id,
          webhookUrl: existing.url,
          warnings,
        };
      }
    }

    // Create new endpoint
    if (options.verbose) {
      console.log(`[webhook] Creating new endpoint for ${options.shopId}`);
      console.log(`[webhook]   URL: ${webhookUrl}`);
    }

    const created = await createEndpoint(
      stripe,
      options.shopId,
      webhookUrl,
      [...DEFAULT_WEBHOOK_EVENTS]
    );

    console.log(`[webhook] Created webhook endpoint: ${created.id}`);
    console.log(`[webhook]   URL: ${created.url}`);
    console.log(`[webhook]   Events: ${created.enabled_events?.length} event types`);

    // Important: Output the secret for storage
    if (created.secret) {
      console.log("");
      console.log("=".repeat(60));
      console.log("WEBHOOK SIGNING SECRET");
      console.log("=".repeat(60));
      console.log("");
      console.log(`STRIPE_WEBHOOK_SECRET=${created.secret}`);
      console.log("");
      console.log("Add this to your environment variables:");
      console.log("  - GitHub Actions: Add as repository secret");
      console.log("  - Cloudflare: Add to worker environment");
      console.log("=".repeat(60));
    }

    return {
      success: true,
      action: "created",
      endpointId: created.id,
      webhookSecret: created.secret,
      webhookUrl: created.url,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`[webhook] Failed to register webhook: ${message}`);

    return {
      success: false,
      action: "failed",
      error: message,
      warnings,
    };
  }
}

/**
 * Run the webhook registration step in the launch pipeline.
 */
export async function runWebhookStep(
  shopId: string,
  deployUrl: string | undefined,
  options: {
    stripeSecretKey?: string;
    dryRun?: boolean;
    verbose?: boolean;
  } = {}
): Promise<WebhookRegistrationResult> {
  console.log("\nRegistering Stripe webhook...");

  if (!deployUrl) {
    console.log("[webhook] Skipped: No deploy URL available");
    return {
      success: true,
      action: "skipped",
      warnings: ["No deploy URL available - webhook registration skipped"],
    };
  }

  const result = await registerShopWebhook({
    shopId,
    deployUrl,
    stripeSecretKey: options.stripeSecretKey,
    updateExisting: false, // Don't update by default in pipeline
    dryRun: options.dryRun,
    verbose: options.verbose,
  });

  if (result.success) {
    if (result.action === "created") {
      console.log("[webhook] Webhook registered successfully");
    } else if (result.action === "updated") {
      console.log("[webhook] Webhook updated successfully");
    } else if (result.action === "skipped") {
      console.log("[webhook] Webhook registration skipped");
    }
  } else {
    console.error(`[webhook] Webhook registration failed: ${result.error}`);
  }

  return result;
}

export { DEFAULT_WEBHOOK_EVENTS };
