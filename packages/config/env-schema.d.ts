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
 * Environment variable requirement level.
 *
 * - `deploy`: Required for production/preview deployment. Deploy gate will fail if missing.
 * - `runtime-only`: Required at runtime but not at build time. May be injected via Cloudflare bindings.
 * - `dev-only`: Only needed for local development. Can be TODO_ placeholder in production.
 */
export type EnvRequirement = "deploy" | "runtime-only" | "dev-only";
/**
 * When the variable is needed.
 *
 * - `build`: Inlined at build time (NEXT_PUBLIC_*, next.config.js env). Must exist during `next build`.
 * - `runtime`: Accessed at runtime via process.env or Cloudflare context.env.
 * - `both`: Needed at both build and runtime.
 */
export type EnvPhase = "build" | "runtime" | "both";
/**
 * Security exposure level.
 *
 * - `public`: Safe to log, inline in client bundle (NEXT_PUBLIC_*).
 * - `secret`: Must never be logged or exposed to client.
 */
export type EnvExposure = "public" | "secret";
/**
 * Owner/category of the environment variable.
 */
export type EnvOwner = "platform-core" | "auth" | "payments" | "shipping" | "email" | "cms" | "analytics" | "storage" | "internal";
/**
 * Single environment variable definition.
 */
export interface EnvVarDef {
    /** Variable name, e.g., "STRIPE_SECRET_KEY" */
    name: string;
    /** Requirement level for deployment */
    required: EnvRequirement;
    /** Build-time, runtime, or both */
    phase: EnvPhase;
    /** Public or secret */
    exposure: EnvExposure;
    /** Owning subsystem */
    owner: EnvOwner;
    /** Files/entrypoints where this variable is used */
    whereUsed: string[];
    /** Human-readable description */
    description: string;
    /** Condition for requirement (e.g., "when PAYMENTS_PROVIDER=stripe") */
    condition?: string;
    /** Default value in development (if any) */
    devDefault?: string;
}
/**
 * Complete environment schema.
 */
export declare const ENV_SCHEMA: EnvVarDef[];
/**
 * Get all variables required for deployment.
 * These must have real values (not TODO_) before deploy.
 */
export declare function getDeployRequiredVars(): EnvVarDef[];
/**
 * Get all build-time variables (NEXT_PUBLIC_*, etc.).
 * These must exist at `next build` time.
 */
export declare function getBuildTimeVars(): EnvVarDef[];
/**
 * Get all secret variables (must never be logged or exposed).
 */
export declare function getSecretVars(): EnvVarDef[];
/**
 * Get variables by owner/category.
 */
export declare function getVarsByOwner(owner: EnvOwner): EnvVarDef[];
/**
 * Get variable definition by name.
 */
export declare function getVarDef(name: string): EnvVarDef | undefined;
/**
 * Validate that an env object has all required deploy vars.
 * Returns list of missing/invalid variable names.
 *
 * @param env - Environment object to validate
 * @param sentinel - Placeholder prefix to reject (default: "TODO_")
 * @returns Array of {name, reason} for failed validations
 */
export declare function validateDeployEnv(env: Record<string, string | undefined>, sentinel?: string): Array<{
    name: string;
    reason: string;
}>;
/**
 * Check if a value looks like a placeholder.
 * Matches: TODO_, __REPLACE_ME__, placeholder, etc.
 */
export declare function isPlaceholder(value: string | undefined): boolean;
//# sourceMappingURL=env-schema.d.ts.map