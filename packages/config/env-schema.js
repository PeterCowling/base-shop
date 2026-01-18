/**
 * Environment Variable Schema for Deploy Gate
 *
 * This module defines a machine-readable schema for all environment variables
 * used in the Base-Shop platform. It is the **single source of truth** consumed by:
 *
 * - Deploy gate (scripts/validate-deploy-env.sh)
 * - Init scripts (init-shop, quickstart-shop)
 * - Documentation generation
 * - Runtime validation
 *
 * Created as part of SEC-01 in the Integrated Secrets Workflow Plan.
 * See: docs/plans/integrated-secrets-workflow-plan.md
 *
 * @module @acme/config/env-schema
 */
/**
 * Complete environment schema.
 */
export const ENV_SCHEMA = [
    // =============================================================================
    // AUTHENTICATION & SESSION (required for deploy)
    // =============================================================================
    {
        name: "NEXTAUTH_SECRET",
        required: "deploy",
        phase: "both",
        exposure: "secret",
        owner: "auth",
        whereUsed: ["packages/auth", "apps/*/src/app/api/auth"],
        description: "Secret for NextAuth.js session encryption. Must be 32+ chars in production.",
        devDefault: "dev-nextauth-secret-32-chars-long-string!",
    },
    {
        name: "SESSION_SECRET",
        required: "deploy",
        phase: "both",
        exposure: "secret",
        owner: "auth",
        whereUsed: ["packages/auth", "packages/platform-core"],
        description: "Secret for session cookie signing. Must be 32+ chars in production.",
        devDefault: "dev-session-secret-32-chars-long-string!",
    },
    {
        name: "CART_COOKIE_SECRET",
        required: "deploy",
        phase: "both",
        exposure: "secret",
        owner: "platform-core",
        whereUsed: ["packages/platform-core/src/cart"],
        description: "Secret for cart cookie encryption.",
        devDefault: "dev-cart-cookie-secret-32-chars!",
    },
    // =============================================================================
    // PAYMENTS (conditional on PAYMENTS_PROVIDER=stripe)
    // =============================================================================
    {
        name: "STRIPE_SECRET_KEY",
        required: "deploy",
        phase: "runtime",
        exposure: "secret",
        owner: "payments",
        whereUsed: ["packages/stripe", "apps/*/src/app/api/checkout"],
        description: "Stripe secret API key for server-side operations.",
        condition: "when PAYMENTS_PROVIDER=stripe",
    },
    {
        name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        required: "deploy",
        phase: "build",
        exposure: "public",
        owner: "payments",
        whereUsed: ["packages/stripe", "apps/*/src/components/checkout"],
        description: "Stripe publishable key for client-side Stripe.js.",
        condition: "when PAYMENTS_PROVIDER=stripe",
    },
    {
        name: "STRIPE_WEBHOOK_SECRET",
        required: "deploy",
        phase: "runtime",
        exposure: "secret",
        owner: "payments",
        whereUsed: ["apps/*/src/app/api/webhooks/stripe"],
        description: "Stripe webhook signing secret for verifying webhook payloads.",
        condition: "when PAYMENTS_PROVIDER=stripe",
    },
    // =============================================================================
    // DATABASE & STORAGE
    // =============================================================================
    {
        name: "DATABASE_URL",
        required: "runtime-only",
        phase: "runtime",
        exposure: "secret",
        owner: "platform-core",
        whereUsed: ["packages/platform-core/prisma"],
        description: "PostgreSQL connection string. Optional if using JSON file backend.",
        condition: "when using Prisma backend",
    },
    // =============================================================================
    // REDIS / UPSTASH (conditional on store provider)
    // =============================================================================
    {
        name: "UPSTASH_REDIS_REST_URL",
        required: "deploy",
        phase: "both",
        exposure: "secret",
        owner: "storage",
        whereUsed: ["packages/auth", "packages/platform-core"],
        description: "Upstash Redis REST API URL for session/rate limiting storage.",
        condition: "when SESSION_STORE_PROVIDER=redis or RATE_LIMIT_STORE_PROVIDER=redis",
    },
    {
        name: "UPSTASH_REDIS_REST_TOKEN",
        required: "deploy",
        phase: "both",
        exposure: "secret",
        owner: "storage",
        whereUsed: ["packages/auth", "packages/platform-core"],
        description: "Upstash Redis REST API token.",
        condition: "when SESSION_STORE_PROVIDER=redis or RATE_LIMIT_STORE_PROVIDER=redis",
    },
    // =============================================================================
    // EMAIL (conditional on EMAIL_PROVIDER)
    // =============================================================================
    {
        name: "EMAIL_FROM",
        required: "deploy",
        phase: "both",
        exposure: "public",
        owner: "email",
        whereUsed: ["packages/email"],
        description: "Default sender email address for transactional emails.",
        condition: "when email provider is configured",
    },
    {
        name: "SENDGRID_API_KEY",
        required: "deploy",
        phase: "runtime",
        exposure: "secret",
        owner: "email",
        whereUsed: ["packages/email"],
        description: "SendGrid API key for email delivery.",
        condition: "when EMAIL_PROVIDER=sendgrid",
    },
    {
        name: "RESEND_API_KEY",
        required: "deploy",
        phase: "runtime",
        exposure: "secret",
        owner: "email",
        whereUsed: ["packages/email"],
        description: "Resend API key for email delivery.",
        condition: "when EMAIL_PROVIDER=resend",
    },
    // =============================================================================
    // CMS (conditional)
    // =============================================================================
    {
        name: "SANITY_PROJECT_ID",
        required: "deploy",
        phase: "both",
        exposure: "public",
        owner: "cms",
        whereUsed: ["packages/cms-sanity", "apps/cms"],
        description: "Sanity.io project ID.",
        condition: "when using Sanity CMS",
    },
    {
        name: "SANITY_DATASET",
        required: "deploy",
        phase: "both",
        exposure: "public",
        owner: "cms",
        whereUsed: ["packages/cms-sanity", "apps/cms"],
        description: "Sanity.io dataset name (e.g., 'production', 'staging').",
        condition: "when using Sanity CMS",
    },
    {
        name: "SANITY_API_TOKEN",
        required: "deploy",
        phase: "runtime",
        exposure: "secret",
        owner: "cms",
        whereUsed: ["packages/cms-sanity"],
        description: "Sanity.io API token for write operations.",
        condition: "when using Sanity CMS with write access",
    },
    // =============================================================================
    // ANALYTICS (optional but recommended)
    // =============================================================================
    {
        name: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
        required: "dev-only",
        phase: "build",
        exposure: "public",
        owner: "analytics",
        whereUsed: ["apps/*/src/app/layout.tsx"],
        description: "Google Analytics 4 measurement ID.",
    },
    {
        name: "GA_API_SECRET",
        required: "dev-only",
        phase: "runtime",
        exposure: "secret",
        owner: "analytics",
        whereUsed: ["packages/analytics"],
        description: "Google Analytics Measurement Protocol API secret.",
        condition: "when using server-side GA events",
    },
    // =============================================================================
    // CLOUDFLARE / DEPLOYMENT
    // =============================================================================
    {
        name: "CLOUDFLARE_ACCOUNT_ID",
        required: "deploy",
        phase: "build",
        exposure: "secret",
        owner: "internal",
        whereUsed: [".github/workflows/*.yml", "wrangler.toml"],
        description: "Cloudflare account ID for Pages deployment.",
    },
    {
        name: "CLOUDFLARE_API_TOKEN",
        required: "deploy",
        phase: "build",
        exposure: "secret",
        owner: "internal",
        whereUsed: [".github/workflows/*.yml"],
        description: "Cloudflare API token with Pages deployment permissions.",
    },
    // =============================================================================
    // CI/BUILD (optional, improves speed)
    // =============================================================================
    {
        name: "TURBO_TOKEN",
        required: "dev-only",
        phase: "build",
        exposure: "secret",
        owner: "internal",
        whereUsed: [".github/workflows/*.yml"],
        description: "Turborepo remote cache token for faster CI builds.",
    },
    {
        name: "TURBO_TEAM",
        required: "dev-only",
        phase: "build",
        exposure: "public",
        owner: "internal",
        whereUsed: [".github/workflows/*.yml"],
        description: "Turborepo team name for remote cache.",
    },
    // =============================================================================
    // SHIPPING (conditional)
    // =============================================================================
    {
        name: "SHIPPING_PROVIDER",
        required: "dev-only",
        phase: "runtime",
        exposure: "public",
        owner: "shipping",
        whereUsed: ["packages/shipping"],
        description: "Shipping rate provider (none, shippo, ups, dhl, external).",
    },
    // =============================================================================
    // FEATURE FLAGS
    // =============================================================================
    {
        name: "PAYMENTS_PROVIDER",
        required: "dev-only",
        phase: "runtime",
        exposure: "public",
        owner: "payments",
        whereUsed: ["packages/stripe", "packages/config/src/env/payments.ts"],
        description: "Payment provider selection (stripe).",
        devDefault: "stripe",
    },
    {
        name: "EMAIL_PROVIDER",
        required: "dev-only",
        phase: "both",
        exposure: "public",
        owner: "email",
        whereUsed: ["packages/email"],
        description: "Email provider selection (smtp, sendgrid, resend).",
        devDefault: "smtp",
    },
    {
        name: "AUTH_PROVIDER",
        required: "dev-only",
        phase: "both",
        exposure: "public",
        owner: "auth",
        whereUsed: ["packages/auth"],
        description: "Authentication provider (local, jwt, oauth).",
        devDefault: "local",
    },
];
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
/**
 * Get all variables required for deployment.
 * These must have real values (not TODO_) before deploy.
 */
export function getDeployRequiredVars() {
    return ENV_SCHEMA.filter((v) => v.required === "deploy");
}
/**
 * Get all build-time variables (NEXT_PUBLIC_*, etc.).
 * These must exist at `next build` time.
 */
export function getBuildTimeVars() {
    return ENV_SCHEMA.filter((v) => v.phase === "build" || v.phase === "both");
}
/**
 * Get all secret variables (must never be logged or exposed).
 */
export function getSecretVars() {
    return ENV_SCHEMA.filter((v) => v.exposure === "secret");
}
/**
 * Get variables by owner/category.
 */
export function getVarsByOwner(owner) {
    return ENV_SCHEMA.filter((v) => v.owner === owner);
}
/**
 * Get variable definition by name.
 */
export function getVarDef(name) {
    return ENV_SCHEMA.find((v) => v.name === name);
}
/**
 * Validate that an env object has all required deploy vars.
 * Returns list of missing/invalid variable names.
 *
 * @param env - Environment object to validate
 * @param sentinel - Placeholder prefix to reject (default: "TODO_")
 * @returns Array of {name, reason} for failed validations
 */
export function validateDeployEnv(env, sentinel = "TODO_") {
    const failures = [];
    for (const varDef of getDeployRequiredVars()) {
        const value = env[varDef.name];
        // Skip conditional requirements if condition not met
        if (varDef.condition) {
            // Simple condition parsing for common patterns
            const match = varDef.condition.match(/when (\w+)=(\w+)/);
            if (match) {
                const [, condVar, condVal] = match;
                if (env[condVar] !== condVal) {
                    continue; // Condition not met, skip this var
                }
            }
        }
        if (value === undefined || value === "") {
            failures.push({ name: varDef.name, reason: "missing" });
        }
        else if (value.startsWith(sentinel)) {
            failures.push({ name: varDef.name, reason: `placeholder (${sentinel})` });
        }
    }
    return failures;
}
/**
 * Check if a value looks like a placeholder.
 * Matches: TODO_, __REPLACE_ME__, placeholder, etc.
 */
export function isPlaceholder(value) {
    if (!value)
        return true;
    const placeholderPatterns = [
        /^TODO_/i,
        /^__REPLACE_ME__$/i,
        /^placeholder$/i,
        /^CHANGEME$/i,
        /^xxx+$/i,
    ];
    return placeholderPatterns.some((p) => p.test(value));
}
