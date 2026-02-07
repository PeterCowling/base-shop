import { cfFetch, getAccountId, getApiToken } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

interface AccountInfo {
  id: string;
  name: string;
  type: string;
  settings?: {
    enforce_twofactor?: boolean;
  };
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export const healthTools = [
  {
    name: "cloudflare_test_connection",
    description: "Test Cloudflare API connectivity and verify credentials",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "cloudflare_account_info",
    description: "Get information about the connected Cloudflare account",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "cloudflare_token_verify",
    description: "Verify the API token and list its permissions",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
] as const;

export async function handleHealthTool(name: string, _args: unknown) {
  try {
    switch (name) {
      case "cloudflare_test_connection": {
        const startTime = Date.now();
        const checks: Record<string, { status: "ok" | "error"; ms?: number; error?: string }> = {};

        // Verify environment variables are set
        const accountId = getAccountId();
        const token = getApiToken();

        if (!accountId) {
          checks.accountId = { status: "error", error: "CLOUDFLARE_ACCOUNT_ID not set" };
        } else {
          checks.accountId = { status: "ok" };
        }

        if (!token) {
          checks.apiToken = { status: "error", error: "CLOUDFLARE_API_TOKEN not set" };
        } else {
          checks.apiToken = { status: "ok" };
        }

        // Test API connectivity
        try {
          const apiStart = Date.now();
          await cfFetch<{ id: string }>(`/user/tokens/verify`);
          checks.apiConnectivity = { status: "ok", ms: Date.now() - apiStart };
        } catch (e) {
          checks.apiConnectivity = { status: "error", error: e instanceof Error ? e.message : "API connection failed" };
        }

        // Test account access
        if (accountId) {
          try {
            const accountStart = Date.now();
            await cfFetch<AccountInfo>(`/accounts/${accountId}`);
            checks.accountAccess = { status: "ok", ms: Date.now() - accountStart };
          } catch (e) {
            checks.accountAccess = { status: "error", error: e instanceof Error ? e.message : "Account access failed" };
          }
        }

        const allHealthy = Object.values(checks).every((c) => c.status === "ok");

        return jsonResult({
          status: allHealthy ? "healthy" : "degraded",
          server: "cloudflare-mcp",
          timestamp: new Date().toISOString(),
          totalMs: Date.now() - startTime,
          checks,
        });
      }

      case "cloudflare_account_info": {
        const accountId = getAccountId();
        const account = await cfFetch<AccountInfo>(`/accounts/${accountId}`);

        // Get zones count
        let zonesCount = 0;
        try {
          const zonesResponse = await cfFetch<Array<{ id: string }>>(`/zones?account.id=${accountId}&per_page=1`);
          zonesCount = Array.isArray(zonesResponse) ? zonesResponse.length : 0;
        } catch {
          // Zones access might be limited
        }

        // Get Pages projects count
        let pagesCount = 0;
        try {
          const pagesResponse = await cfFetch<Array<{ id: string }>>(`/accounts/${accountId}/pages/projects?per_page=1`);
          pagesCount = Array.isArray(pagesResponse) ? pagesResponse.length : 0;
        } catch {
          // Pages access might be limited
        }

        return jsonResult({
          account: {
            id: account.id,
            name: account.name,
            type: account.type,
            twoFactorEnabled: account.settings?.enforce_twofactor ?? "unknown",
          },
          resources: {
            zonesAccessible: zonesCount > 0,
            pagesAccessible: pagesCount > 0,
          },
        });
      }

      case "cloudflare_token_verify": {
        // Verify token
        const tokenInfo = await cfFetch<{
          id: string;
          status: string;
          not_before?: string;
          expires_on?: string;
        }>(`/user/tokens/verify`);

        // Get user info
        let user: User | null = null;
        try {
          user = await cfFetch<User>(`/user`);
        } catch {
          // User access might be limited
        }

        // Test various API capabilities to infer permissions
        const permissions: Record<string, boolean> = {};
        const accountId = getAccountId();

        // Test zones read
        try {
          await cfFetch<unknown[]>(`/zones?per_page=1`);
          permissions.zonesRead = true;
        } catch {
          permissions.zonesRead = false;
        }

        // Test Pages read
        try {
          await cfFetch<unknown[]>(`/accounts/${accountId}/pages/projects?per_page=1`);
          permissions.pagesRead = true;
        } catch {
          permissions.pagesRead = false;
        }

        // Test R2 read
        try {
          await cfFetch<{ buckets: unknown[] }>(`/accounts/${accountId}/r2/buckets`);
          permissions.r2Read = true;
        } catch {
          permissions.r2Read = false;
        }

        // Test KV read
        try {
          await cfFetch<unknown[]>(`/accounts/${accountId}/storage/kv/namespaces?per_page=1`);
          permissions.kvRead = true;
        } catch {
          permissions.kvRead = false;
        }

        return jsonResult({
          token: {
            id: tokenInfo.id,
            status: tokenInfo.status,
            notBefore: tokenInfo.not_before,
            expiresOn: tokenInfo.expires_on,
          },
          user: user ? {
            id: user.id,
            email: user.email,
            name: [user.first_name, user.last_name].filter(Boolean).join(" ") || undefined,
          } : null,
          permissions,
          note: "Permissions are inferred from API access tests, not from token metadata",
        });
      }

      default:
        return errorResult(`Unknown health tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
