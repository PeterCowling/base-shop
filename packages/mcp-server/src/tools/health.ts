import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

export const healthTools = [
  {
    name: "health_check",
    description: "Test MCP server connectivity and database connection",
    inputSchema: {
      type: "object",
      properties: {},
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

        const allHealthy = Object.values(checks).every((c) => c.status === "ok");

        return jsonResult({
          status: allHealthy ? "healthy" : "degraded",
          server: "base-shop-mcp",
          timestamp: new Date().toISOString(),
          totalMs: Date.now() - startTime,
          checks,
        });
      }

      case "health_database": {
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
