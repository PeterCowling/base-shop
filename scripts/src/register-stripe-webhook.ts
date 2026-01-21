#!/usr/bin/env node
/**
 * LAUNCH-17: Automated Stripe Webhook Registration
 *
 * Registers or updates Stripe webhook endpoints for a shop.
 * Outputs the webhook signing secret for storage in environment/secrets.
 *
 * Usage:
 *   pnpm register-stripe-webhook --shop <id> --url <webhook-url> [options]
 *
 * Options:
 *   --shop <id>         Shop identifier (required)
 *   --url <url>         Webhook endpoint URL (required)
 *   --stripe-key <key>  Stripe secret key (default: STRIPE_SECRET_KEY env)
 *   --events <list>     Comma-separated event types (default: all supported)
 *   --update            Update existing endpoint if found
 *   --delete            Delete existing endpoint
 *   --list              List all webhook endpoints
 *   --dry-run           Show what would be done without making changes
 *   --verbose           Verbose output
 *   --json              Output results as JSON
 *
 * Environment:
 *   STRIPE_SECRET_KEY   Stripe API secret key
 *
 * Examples:
 *   pnpm register-stripe-webhook --shop acme --url https://acme.example.com/api/stripe-webhook
 *   pnpm register-stripe-webhook --list
 *   pnpm register-stripe-webhook --shop acme --url https://... --update
 */

import Stripe from "stripe";

// ============================================================
// Types
// ============================================================

interface RegisterOptions {
  shopId: string;
  webhookUrl: string;
  stripeKey: string;
  events: string[];
  update: boolean;
  deleteEndpoint: boolean;
  list: boolean;
  dryRun: boolean;
  verbose: boolean;
  json: boolean;
}

interface RegistrationResult {
  success: boolean;
  action: "created" | "updated" | "deleted" | "listed" | "none";
  endpointId?: string;
  webhookSecret?: string;
  url?: string;
  events?: string[];
  error?: string;
  endpoints?: Stripe.WebhookEndpoint[];
}

// ============================================================
// Constants
// ============================================================

/**
 * Default webhook events that the platform handles.
 * These match the handlers in handleStripeWebhook.ts
 */
const DEFAULT_WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] =
  [
    "checkout.session.completed",
    "charge.refunded",
    "charge.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.succeeded",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "review.opened",
    "review.closed",
    "radar.early_fraud_warning.created",
  ];

/**
 * API version to use for webhook registration.
 */
const STRIPE_API_VERSION = "2025-06-30.basil" as const;

// ============================================================
// CLI Parsing
// ============================================================

function parseArgs(args: string[]): RegisterOptions {
  const options: RegisterOptions = {
    shopId: "",
    webhookUrl: "",
    stripeKey: process.env.STRIPE_SECRET_KEY || "",
    events: [...DEFAULT_WEBHOOK_EVENTS],
    update: false,
    deleteEndpoint: false,
    list: false,
    dryRun: false,
    verbose: false,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--shop":
      case "-s":
        options.shopId = next || "";
        i++;
        break;
      case "--url":
      case "-u":
        options.webhookUrl = next || "";
        i++;
        break;
      case "--stripe-key":
      case "-k":
        options.stripeKey = next || "";
        i++;
        break;
      case "--events":
      case "-e":
        options.events = (next || "")
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
        i++;
        break;
      case "--update":
        options.update = true;
        break;
      case "--delete":
        options.deleteEndpoint = true;
        break;
      case "--list":
      case "-l":
        options.list = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Stripe Webhook Registration (LAUNCH-17)

Usage: pnpm register-stripe-webhook --shop <id> --url <webhook-url> [options]

Options:
  -s, --shop <id>         Shop identifier (required for register/update/delete)
  -u, --url <url>         Webhook endpoint URL (required for register/update)
  -k, --stripe-key <key>  Stripe secret key (default: STRIPE_SECRET_KEY env)
  -e, --events <list>     Comma-separated event types (default: all supported)
  --update                Update existing endpoint if found
  --delete                Delete existing endpoint for shop
  -l, --list              List all webhook endpoints
  --dry-run               Show what would be done without making changes
  -v, --verbose           Verbose output
  --json                  Output results as JSON
  -h, --help              Show this help

Environment:
  STRIPE_SECRET_KEY       Stripe API secret key

Examples:
  # Register a new webhook
  pnpm register-stripe-webhook --shop acme --url https://acme.example.com/api/stripe-webhook

  # List existing webhooks
  pnpm register-stripe-webhook --list

  # Update an existing webhook
  pnpm register-stripe-webhook --shop acme --url https://new-url.example.com/api/stripe-webhook --update

  # Delete a webhook
  pnpm register-stripe-webhook --shop acme --delete

  # Dry run
  pnpm register-stripe-webhook --shop acme --url https://... --dry-run

Default Events:
  ${DEFAULT_WEBHOOK_EVENTS.join("\n  ")}
`);
}

// ============================================================
// Stripe Operations
// ============================================================

/**
 * Find existing webhook endpoint for a shop by URL pattern.
 */
async function findExistingEndpoint(
  stripe: Stripe,
  shopId: string,
  webhookUrl?: string
): Promise<Stripe.WebhookEndpoint | undefined> {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });

  for (const endpoint of endpoints.data) {
    // Match by URL if provided
    if (webhookUrl && endpoint.url === webhookUrl) {
      return endpoint;
    }

    // Match by metadata shop ID
    if (endpoint.metadata?.shopId === shopId) {
      return endpoint;
    }

    // Match by URL containing shop ID pattern
    if (
      endpoint.url.includes(`/${shopId}/`) ||
      endpoint.url.includes(`shop=${shopId}`)
    ) {
      return endpoint;
    }
  }

  return undefined;
}

/**
 * List all webhook endpoints.
 */
async function listEndpoints(
  stripe: Stripe,
  verbose: boolean
): Promise<Stripe.WebhookEndpoint[]> {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });

  if (verbose) {
    console.log(`Found ${endpoints.data.length} webhook endpoint(s)\n`);
  }

  return endpoints.data;
}

/**
 * Create a new webhook endpoint.
 */
async function createEndpoint(
  stripe: Stripe,
  shopId: string,
  url: string,
  events: string[]
): Promise<Stripe.WebhookEndpoint> {
  return stripe.webhookEndpoints.create({
    url,
    enabled_events: events as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
    description: `Webhook for shop: ${shopId}`,
    metadata: {
      shopId,
      createdAt: new Date().toISOString(),
      createdBy: "register-stripe-webhook",
    },
  });
}

/**
 * Update an existing webhook endpoint.
 */
async function updateEndpoint(
  stripe: Stripe,
  endpointId: string,
  shopId: string,
  url: string,
  events: string[]
): Promise<Stripe.WebhookEndpoint> {
  return stripe.webhookEndpoints.update(endpointId, {
    url,
    enabled_events: events as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
    description: `Webhook for shop: ${shopId}`,
    metadata: {
      shopId,
      updatedAt: new Date().toISOString(),
      updatedBy: "register-stripe-webhook",
    },
  });
}

/**
 * Delete a webhook endpoint.
 */
async function deleteEndpoint(
  stripe: Stripe,
  endpointId: string
): Promise<Stripe.DeletedWebhookEndpoint> {
  return stripe.webhookEndpoints.del(endpointId);
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  // Validate Stripe key
  if (!options.stripeKey) {
    console.error("Error: Stripe secret key required.");
    console.error(
      "Set STRIPE_SECRET_KEY environment variable or use --stripe-key"
    );
    process.exit(1);
  }

  // Create Stripe client
  const stripe = new Stripe(options.stripeKey, {
    apiVersion: STRIPE_API_VERSION,
  });

  // Handle list mode
  if (options.list) {
    const endpoints = await listEndpoints(stripe, options.verbose);

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            action: "listed",
            endpoints: endpoints.map((e) => ({
              id: e.id,
              url: e.url,
              status: e.status,
              events: e.enabled_events,
              metadata: e.metadata,
              created: new Date(e.created * 1000).toISOString(),
            })),
          },
          null,
          2
        )
      );
    } else {
      for (const endpoint of endpoints) {
        console.log(`ID: ${endpoint.id}`);
        console.log(`  URL: ${endpoint.url}`);
        console.log(`  Status: ${endpoint.status}`);
        console.log(`  Shop: ${endpoint.metadata?.shopId || "(not tagged)"}`);
        console.log(
          `  Created: ${new Date(endpoint.created * 1000).toISOString()}`
        );
        if (options.verbose) {
          console.log(`  Events: ${endpoint.enabled_events?.join(", ")}`);
        }
        console.log("");
      }
    }
    return;
  }

  // Validate required arguments for register/update/delete
  if (!options.shopId) {
    console.error("Error: --shop is required");
    printHelp();
    process.exit(1);
  }

  if (!options.deleteEndpoint && !options.webhookUrl) {
    console.error("Error: --url is required for registration");
    printHelp();
    process.exit(1);
  }

  // Validate URL format
  if (options.webhookUrl) {
    try {
      new URL(options.webhookUrl);
    } catch {
      console.error(`Error: Invalid webhook URL: ${options.webhookUrl}`);
      process.exit(1);
    }

    // Warn if not HTTPS
    if (!options.webhookUrl.startsWith("https://")) {
      console.warn(
        "Warning: Webhook URL should use HTTPS for production environments"
      );
    }
  }

  const result: RegistrationResult = {
    success: false,
    action: "none",
  };

  try {
    // Find existing endpoint
    const existing = await findExistingEndpoint(
      stripe,
      options.shopId,
      options.webhookUrl
    );

    if (options.verbose) {
      if (existing) {
        console.log(`Found existing endpoint: ${existing.id}`);
      } else {
        console.log("No existing endpoint found");
      }
    }

    // Handle delete
    if (options.deleteEndpoint) {
      if (!existing) {
        console.error(
          `Error: No webhook endpoint found for shop "${options.shopId}"`
        );
        process.exit(1);
      }

      if (options.dryRun) {
        console.log(
          `[DRY RUN] Would delete webhook endpoint: ${existing.id}`
        );
        result.action = "deleted";
        result.success = true;
        result.endpointId = existing.id;
      } else {
        await deleteEndpoint(stripe, existing.id);
        result.action = "deleted";
        result.success = true;
        result.endpointId = existing.id;

        if (!options.json) {
          console.log(`Deleted webhook endpoint: ${existing.id}`);
        }
      }
    }
    // Handle update
    else if (options.update && existing) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would update webhook endpoint: ${existing.id}`);
        console.log(`  URL: ${options.webhookUrl}`);
        console.log(`  Events: ${options.events.length} event types`);
        result.action = "updated";
        result.success = true;
        result.endpointId = existing.id;
      } else {
        const updated = await updateEndpoint(
          stripe,
          existing.id,
          options.shopId,
          options.webhookUrl,
          options.events
        );
        result.action = "updated";
        result.success = true;
        result.endpointId = updated.id;
        result.url = updated.url;
        result.events = updated.enabled_events;

        if (!options.json) {
          console.log(`Updated webhook endpoint: ${updated.id}`);
          console.log(`  URL: ${updated.url}`);
          console.log(`  Events: ${updated.enabled_events?.length} event types`);
          console.log("");
          console.log(
            "Note: Webhook signing secret remains unchanged after update."
          );
          console.log(
            "If you need a new secret, delete and recreate the endpoint."
          );
        }
      }
    }
    // Handle create
    else if (!existing) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would create webhook endpoint`);
        console.log(`  Shop: ${options.shopId}`);
        console.log(`  URL: ${options.webhookUrl}`);
        console.log(`  Events: ${options.events.length} event types`);
        if (options.verbose) {
          console.log(`  Event list: ${options.events.join(", ")}`);
        }
        result.action = "created";
        result.success = true;
      } else {
        const created = await createEndpoint(
          stripe,
          options.shopId,
          options.webhookUrl,
          options.events
        );
        result.action = "created";
        result.success = true;
        result.endpointId = created.id;
        result.webhookSecret = created.secret;
        result.url = created.url;
        result.events = created.enabled_events;

        if (!options.json) {
          console.log("=".repeat(60));
          console.log("WEBHOOK ENDPOINT CREATED");
          console.log("=".repeat(60));
          console.log("");
          console.log(`Shop:     ${options.shopId}`);
          console.log(`ID:       ${created.id}`);
          console.log(`URL:      ${created.url}`);
          console.log(`Status:   ${created.status}`);
          console.log(`Events:   ${created.enabled_events?.length} event types`);
          console.log("");
          console.log("-".repeat(60));
          console.log("WEBHOOK SIGNING SECRET (save this securely!)");
          console.log("-".repeat(60));
          console.log("");
          console.log(`STRIPE_WEBHOOK_SECRET=${created.secret}`);
          console.log("");
          console.log("-".repeat(60));
          console.log("");
          console.log("Add this to your environment variables:");
          console.log("  - GitHub Actions: Add as repository secret");
          console.log("  - Cloudflare: Add to worker environment");
          console.log("  - Local: Add to .env.local");
          console.log("=".repeat(60));
        }
      }
    }
    // Endpoint exists but --update not specified
    else {
      console.error(
        `Error: Webhook endpoint already exists for shop "${options.shopId}"`
      );
      console.error(`  Endpoint ID: ${existing.id}`);
      console.error(`  URL: ${existing.url}`);
      console.error("");
      console.error("Use --update to modify the existing endpoint.");
      console.error("Use --delete to remove it first.");
      process.exit(1);
    }

    // Output JSON result
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    result.success = false;
    result.error = message;

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`Error: ${message}`);
      if (
        error instanceof Stripe.errors.StripeError &&
        options.verbose
      ) {
        console.error(`  Type: ${error.type}`);
        console.error(`  Code: ${error.code}`);
      }
    }
    process.exit(1);
  }
}

// Entry point
if (process.argv[1]?.includes("register-stripe-webhook")) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}

export {
  parseArgs,
  findExistingEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  listEndpoints,
  DEFAULT_WEBHOOK_EVENTS,
  type RegisterOptions,
  type RegistrationResult,
};
