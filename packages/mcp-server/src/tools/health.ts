import { existsSync } from "node:fs";
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

interface EmailPreflightOptions {
  strict?: boolean;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  fileExists?: (filePath: string) => boolean;
  gmailStatus?: GmailClientStatusSnapshot;
  databaseProbe?: () => Promise<DatabaseProbeResult>;
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
