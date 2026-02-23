import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

const healthCheckSchema = z
  .object({
    strict: z.boolean().optional().default(false),
  })
  .strict();

type DependencyStatus = "ok" | "fail";
type DependencySeverity = "critical" | "warning";

export interface EmailPreflightCheck {
  key: string;
  label: string;
  status: DependencyStatus;
  severity: DependencySeverity;
  detail: string;
  remediation: string;
}

export interface EmailPreflightSummary {
  status: "pass" | "warn" | "fail";
  strict: boolean;
  checkedAt: string;
  checks: EmailPreflightCheck[];
  totals: {
    ok: number;
    fail: number;
    criticalFailures: number;
    warningFailures: number;
  };
}

type DatabaseProbeResult = {
  status: DependencyStatus;
  detail: string;
  remediation: string;
};

interface GmailClientStatusSnapshot {
  hasCredentials: boolean;
  hasToken: boolean;
  credentialsPath: string;
  tokenPath: string;
}

type GmailApiProbeResult = {
  status: DependencyStatus;
  detail: string;
  remediation: string;
  latency_ms?: number;
  email?: string;
};

type TokenExpiryResult = {
  status: DependencyStatus;
  severity: DependencySeverity;
  detail: string;
  remediation: string;
};

interface EmailPreflightOptions {
  strict?: boolean;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  fileExists?: (filePath: string) => boolean;
  gmailStatus?: GmailClientStatusSnapshot;
  databaseProbe?: () => Promise<DatabaseProbeResult>;
  gmailApiProbe?: () => Promise<GmailApiProbeResult>;
  tokenExpiryCheck?: () => TokenExpiryResult;
}

function readEnvValue(env: NodeJS.ProcessEnv, key: string): string {
  return env[key]?.trim() ?? "";
}

function buildOkCheck(
  key: string,
  label: string,
  detail: string,
  remediation = "No action required."
): EmailPreflightCheck {
  return {
    key,
    label,
    status: "ok",
    severity: "warning",
    detail,
    remediation,
  };
}

function buildFailedCheck(
  key: string,
  label: string,
  severity: DependencySeverity,
  detail: string,
  remediation: string
): EmailPreflightCheck {
  return {
    key,
    label,
    status: "fail",
    severity,
    detail,
    remediation,
  };
}

function defaultOctorateStorageStatePath(
  cwd = process.cwd(),
  env = process.env
): string {
  const override = env.OCTORATE_STORAGE_STATE_PATH?.trim();
  if (override) {
    return override;
  }
  return path.join(cwd, ".secrets", "octorate", "storage-state.json");
}

function resolveEmailPreflightStatus(
  checks: EmailPreflightCheck[],
  strict: boolean
): "pass" | "warn" | "fail" {
  const failedChecks = checks.filter((check) => check.status === "fail");
  if (failedChecks.length === 0) {
    return "pass";
  }

  const hasCriticalFailure = failedChecks.some(
    (check) => check.severity === "critical"
  );
  if (hasCriticalFailure) {
    return "fail";
  }

  return strict ? "fail" : "warn";
}

async function probeDatabaseConnection(
  env: NodeJS.ProcessEnv
): Promise<DatabaseProbeResult> {
  const databaseUrl = readEnvValue(env, "DATABASE_URL");
  if (!databaseUrl) {
    return {
      status: "fail",
      detail: "Missing env var: DATABASE_URL",
      remediation:
        "Set DATABASE_URL for Prisma runtime connectivity before enabling DB-backed email tooling.",
    };
  }

  try {
    const { prisma } = await import("@acme/platform-core/db");
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      detail: "Database probe query succeeded.",
      remediation: "No action required.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "fail",
      detail: `Database probe failed: ${message}`,
      remediation:
        "Check DATABASE_URL reachability and Prisma client generation before startup.",
    };
  }
}

const GMAIL_API_PROBE_TIMEOUT_MS = 5_000;
const TOKEN_EXPIRY_WARNING_HOURS = 24;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

async function defaultGmailApiProbe(
  gmailStatus: GmailClientStatusSnapshot
): Promise<GmailApiProbeResult> {
  if (!gmailStatus.hasCredentials || !gmailStatus.hasToken) {
    return {
      status: "fail",
      detail: "Gmail client not available — missing credentials or token.",
      remediation:
        "Ensure credentials.json and token.json are present before running the Gmail API probe.",
    };
  }

  try {
    const { getGmailClient } = await import("../clients/gmail.js");
    const clientResult = await getGmailClient();
    if (!clientResult.success) {
      return {
        status: "fail",
        detail: `Gmail client init failed: ${clientResult.error}`,
        remediation:
          "Check credentials.json and token.json validity, then re-run gmail:auth if needed.",
      };
    }

    const { withRetry } = await import("../utils/gmail-retry.js");
    const startMs = Date.now();
    const profile = await withRetry(
      () =>
        Promise.race([
          clientResult.client.users.getProfile({ userId: "me" }),
          new Promise<never>((_resolve, reject) =>
            setTimeout(
              () => reject(new Error("Gmail API probe timed out")),
              GMAIL_API_PROBE_TIMEOUT_MS
            )
          ),
        ]),
      { maxRetries: 2, baseDelay: 500 }
    );
    const latencyMs = Date.now() - startMs;
    const email = profile.data.emailAddress || "unknown";

    return {
      status: "ok",
      detail: `Gmail API reachable — authenticated as ${email} (${latencyMs}ms).`,
      remediation: "No action required.",
      latency_ms: latencyMs,
      email,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "fail",
      detail: `Gmail API probe failed: ${message}`,
      remediation:
        "Check network connectivity and OAuth token validity. Re-run gmail:auth if the token has expired.",
    };
  }
}

function defaultTokenExpiryCheck(
  gmailStatus: GmailClientStatusSnapshot
): TokenExpiryResult {
  if (!gmailStatus.hasToken) {
    return {
      status: "fail",
      severity: "warning",
      detail: `Token file not found at ${gmailStatus.tokenPath}.`,
      remediation:
        "Run `cd packages/mcp-server && pnpm gmail:auth` to authorize Gmail API access.",
    };
  }

  try {
    const raw = readFileSync(gmailStatus.tokenPath, "utf-8");
    const token = JSON.parse(raw) as Record<string, unknown>;
    const expiryDate =
      typeof token.expiry_date === "number" ? token.expiry_date : undefined;

    if (expiryDate === undefined) {
      return {
        status: "fail",
        severity: "warning",
        detail:
          "Token expiry date unknown — cannot monitor. Published app with 6-month inactivity window.",
        remediation:
          "Token was issued without an expiry_date field. The refresh token remains valid for 6 months of inactivity. No immediate action required.",
      };
    }

    const now = Date.now();

    if (expiryDate <= now) {
      const expiredAt = new Date(expiryDate).toISOString();
      return {
        status: "fail",
        severity: "warning",
        detail: `Token expired at ${expiredAt}.`,
        remediation:
          "Re-run `cd packages/mcp-server && pnpm gmail:auth` to refresh the OAuth token.",
      };
    }

    const remainingMs = expiryDate - now;
    const remainingHours = remainingMs / MS_PER_HOUR;
    const remainingDays = Math.floor(remainingMs / MS_PER_DAY);
    const expiresAt = new Date(expiryDate).toISOString();

    if (remainingHours < TOKEN_EXPIRY_WARNING_HOURS) {
      return {
        status: "fail",
        severity: "warning",
        detail: `Token expires within 24 hours (at ${expiresAt}).`,
        remediation:
          "Proactively re-run `cd packages/mcp-server && pnpm gmail:auth` to refresh the OAuth token before it expires.",
      };
    }

    return {
      status: "ok",
      severity: "warning",
      detail: `Token valid — expires at ${expiresAt} (${remainingDays} days remaining).`,
      remediation: "No action required.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "fail",
      severity: "warning",
      detail: `Failed to read token file: ${message}`,
      remediation:
        "Verify token.json is valid JSON. Re-run gmail:auth if corrupted.",
    };
  }
}

export async function runEmailSystemPreflight(
  options: EmailPreflightOptions = {}
): Promise<EmailPreflightSummary> {
  const env = options.env ?? process.env;
  const strict = options.strict ?? false;
  const cwd = options.cwd ?? process.cwd();
  const fileExists = options.fileExists ?? existsSync;
  const gmailStatus: GmailClientStatusSnapshot = options.gmailStatus
    ? options.gmailStatus
    : await import("../clients/gmail.js").then((module) =>
      module.getGmailClientStatus()
    );
  const databaseProbeResult = options.databaseProbe
    ? await options.databaseProbe()
    : await probeDatabaseConnection(env);
  const tokenExpiryResult = options.tokenExpiryCheck
    ? options.tokenExpiryCheck()
    : defaultTokenExpiryCheck(gmailStatus);

  const checks: EmailPreflightCheck[] = [];

  if (gmailStatus.hasCredentials) {
    checks.push(
      buildOkCheck(
        "gmail_credentials",
        "Gmail credentials.json",
        `Found credentials file at ${gmailStatus.credentialsPath}.`
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "gmail_credentials",
        "Gmail credentials.json",
        "critical",
        `Missing file: ${gmailStatus.credentialsPath}`,
        "Download OAuth desktop credentials and save as credentials.json for Gmail tooling."
      )
    );
  }

  if (gmailStatus.hasToken) {
    checks.push(
      buildOkCheck(
        "gmail_token",
        "Gmail OAuth token",
        `Found token file at ${gmailStatus.tokenPath}.`
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "gmail_token",
        "Gmail OAuth token",
        "warning",
        `Missing file: ${gmailStatus.tokenPath}`,
        "Run `cd packages/mcp-server && pnpm gmail:auth` to authorize Gmail API access."
      )
    );
  }

  const databaseUrl = readEnvValue(env, "DATABASE_URL");
  if (databaseUrl) {
    checks.push(
      buildOkCheck(
        "database_url",
        "DATABASE_URL",
        "DATABASE_URL is configured."
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "database_url",
        "DATABASE_URL",
        "warning",
        "Missing env var: DATABASE_URL",
        "Set DATABASE_URL before running DB-backed startup checks."
      )
    );
  }

  const firebaseDatabaseUrl = readEnvValue(env, "FIREBASE_DATABASE_URL");
  if (firebaseDatabaseUrl) {
    checks.push(
      buildOkCheck(
        "firebase_database_url",
        "FIREBASE_DATABASE_URL",
        "FIREBASE_DATABASE_URL is configured."
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "firebase_database_url",
        "FIREBASE_DATABASE_URL",
        "warning",
        "Missing env var: FIREBASE_DATABASE_URL",
        "Set FIREBASE_DATABASE_URL for cancellation-processing and outbound-draft flows."
      )
    );
  }

  const firebaseApiKey = readEnvValue(env, "FIREBASE_API_KEY");
  if (firebaseApiKey) {
    checks.push(
      buildOkCheck(
        "firebase_api_key",
        "FIREBASE_API_KEY",
        "FIREBASE_API_KEY is configured."
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "firebase_api_key",
        "FIREBASE_API_KEY",
        "warning",
        "Missing env var: FIREBASE_API_KEY",
        "Set FIREBASE_API_KEY for cancellation-processing and Firebase-authenticated API calls."
      )
    );
  }

  const octorateStorageStatePath = defaultOctorateStorageStatePath(cwd, env);
  if (fileExists(octorateStorageStatePath)) {
    checks.push(
      buildOkCheck(
        "octorate_storage_state",
        "Octorate storage state",
        `Found storage state at ${octorateStorageStatePath}.`
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "octorate_storage_state",
        "Octorate storage state",
        "warning",
        `Storage state not found at ${octorateStorageStatePath}.`,
        "Run octorate_login_interactive and complete MFA to generate a reusable session."
      )
    );
  }

  const octorateUsername = readEnvValue(env, "OCTORATE_USERNAME");
  if (octorateUsername) {
    checks.push(
      buildOkCheck(
        "octorate_username",
        "OCTORATE_USERNAME",
        "OCTORATE_USERNAME is configured."
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "octorate_username",
        "OCTORATE_USERNAME",
        "warning",
        "Missing env var: OCTORATE_USERNAME",
        "Set OCTORATE_USERNAME to support interactive Octorate login automation."
      )
    );
  }

  const octoratePassword = readEnvValue(env, "OCTORATE_PASSWORD");
  if (octoratePassword) {
    checks.push(
      buildOkCheck(
        "octorate_password",
        "OCTORATE_PASSWORD",
        "OCTORATE_PASSWORD is configured."
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "octorate_password",
        "OCTORATE_PASSWORD",
        "warning",
        "Missing env var: OCTORATE_PASSWORD",
        "Set OCTORATE_PASSWORD to support interactive Octorate login automation."
      )
    );
  }

  if (databaseProbeResult.status === "ok") {
    checks.push(
      buildOkCheck(
        "database_probe",
        "Database connectivity probe",
        databaseProbeResult.detail
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "database_probe",
        "Database connectivity probe",
        "warning",
        databaseProbeResult.detail,
        databaseProbeResult.remediation
      )
    );
  }

  // Token expiry check (synchronous — reads token.json)
  if (tokenExpiryResult.status === "ok") {
    checks.push(
      buildOkCheck(
        "token_expiry",
        "OAuth token expiry",
        tokenExpiryResult.detail
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "token_expiry",
        "OAuth token expiry",
        tokenExpiryResult.severity,
        tokenExpiryResult.detail,
        tokenExpiryResult.remediation
      )
    );
  }

  // Gmail API connectivity probe (async — network call)
  const gmailApiProbeResult = options.gmailApiProbe
    ? await options.gmailApiProbe()
    : await defaultGmailApiProbe(gmailStatus);

  if (gmailApiProbeResult.status === "ok") {
    checks.push(
      buildOkCheck(
        "gmail_api_probe",
        "Gmail API connectivity probe",
        gmailApiProbeResult.detail
      )
    );
  } else {
    checks.push(
      buildFailedCheck(
        "gmail_api_probe",
        "Gmail API connectivity probe",
        "warning",
        gmailApiProbeResult.detail,
        gmailApiProbeResult.remediation
      )
    );
  }

  const status = resolveEmailPreflightStatus(checks, strict);
  const failedChecks = checks.filter((check) => check.status === "fail");

  return {
    status,
    strict,
    checkedAt: new Date().toISOString(),
    checks,
    totals: {
      ok: checks.length - failedChecks.length,
      fail: failedChecks.length,
      criticalFailures: failedChecks.filter(
        (check) => check.severity === "critical"
      ).length,
      warningFailures: failedChecks.filter(
        (check) => check.severity === "warning"
      ).length,
    },
  };
}

export const healthTools = [
  {
    name: "health_check",
    description: "Test MCP server connectivity and database connection",
    inputSchema: {
      type: "object",
      properties: {
        strict: {
          type: "boolean",
          description:
            "When true, warning-level email preflight failures are promoted to fail status.",
          default: false,
        },
      },
    },
  },
  {
    name: "health_database",
    description: "Check database connection status and basic stats",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
] as const;

export async function handleHealthTool(name: string, _args: unknown) {
  try {
    switch (name) {
      case "health_check": {
        const { strict } = healthCheckSchema.parse(_args ?? {});
        const startTime = Date.now();

        // Test basic functionality
        const checks: Record<string, { status: "ok" | "error"; ms?: number; error?: string }> = {};

        // Check database connection
        try {
          const dbStart = Date.now();
          const { prisma } = await import("@acme/platform-core/db");
          await prisma.$queryRaw`SELECT 1`;
          checks.database = { status: "ok", ms: Date.now() - dbStart };
        } catch (e) {
          checks.database = { status: "error", error: e instanceof Error ? e.message : "Unknown error" };
        }

        // Check shops repository
        try {
          const shopsStart = Date.now();
          const { listShops } = await import("@acme/platform-core/repositories/shops.server");
          await listShops(1, 1);
          checks.shopsRepository = { status: "ok", ms: Date.now() - shopsStart };
        } catch (e) {
          checks.shopsRepository = { status: "error", error: e instanceof Error ? e.message : "Unknown error" };
        }

        const emailPreflight = await runEmailSystemPreflight({ strict });
        const allHealthy = Object.values(checks).every((c) => c.status === "ok");
        const status =
          allHealthy && emailPreflight.status === "pass"
            ? "healthy"
            : emailPreflight.status === "fail"
              ? "unhealthy"
              : "degraded";

        return jsonResult({
          status,
          server: "base-shop-mcp",
          timestamp: new Date().toISOString(),
          totalMs: Date.now() - startTime,
          checks,
          emailPreflight,
        });
      }

      case "health_database": {
        const databaseUrl = process.env.DATABASE_URL?.trim();
        if (!databaseUrl) {
          return errorResult("Database connection failed: Missing env var: DATABASE_URL");
        }

        try {
          const { prisma } = await import("@acme/platform-core/db");

          // Get database version
          const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
          const version = versionResult[0]?.version || "Unknown";

          // Get basic table counts (if available)
          let stats: Record<string, number> = {};
          try {
            const [shopCount, orderCount] = await Promise.all([
              prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM "Shop"`.catch(() => [{ count: BigInt(0) }]),
              prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM "Order"`.catch(() => [{ count: BigInt(0) }]),
            ]);
            stats = {
              shops: Number(shopCount[0]?.count || 0),
              orders: Number(orderCount[0]?.count || 0),
            };
          } catch {
            // Tables might not exist
          }

          return jsonResult({
            status: "connected",
            databaseVersion: version.split(" ")[0],
            fullVersion: version,
            stats,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          return errorResult(`Database connection failed: ${e instanceof Error ? e.message : "Unknown error"}`);
        }
      }

      default:
        return errorResult(`Unknown health tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
