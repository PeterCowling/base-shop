import { z } from "zod";

import { cfFetch, getAccountId } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
  projectNameSchema,
  zoneIdSchema,
} from "../utils/validation.js";

interface ZoneAnalytics {
  requests: {
    all: number;
    cached: number;
    uncached: number;
    ssl: { encrypted: number; unencrypted: number };
  };
  bandwidth: {
    all: number;
    cached: number;
    uncached: number;
  };
  threats: {
    all: number;
    type: Record<string, number>;
  };
  pageviews: {
    all: number;
  };
  uniques: {
    all: number;
  };
}

const timeRangeSchema = z.object({
  since: z.string().optional().describe("Start date (ISO 8601 or relative like -7d)"),
  until: z.string().optional().describe("End date (ISO 8601 or relative like now)"),
});

const zoneAnalyticsSchema = zoneIdSchema.merge(timeRangeSchema);
const pagesAnalyticsSchema = projectNameSchema.merge(timeRangeSchema);
const topPagesSchema = zoneIdSchema.merge(timeRangeSchema).extend({
  limit: z.number().min(1).max(100).optional().default(10),
});

export const analyticsTools = [
  {
    name: "analytics_zone_traffic",
    description: "Get traffic analytics for a DNS zone (requests, bandwidth, threats)",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        since: { type: "string", description: "Start date (e.g., '2024-01-01' or '-7d')", default: "-7d" },
        until: { type: "string", description: "End date (e.g., '2024-01-07' or 'now')", default: "now" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "analytics_zone_summary",
    description: "Get a quick summary of zone traffic for the last 24 hours",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "analytics_top_paths",
    description: "Get top requested paths/URLs for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        since: { type: "string", description: "Start date", default: "-7d" },
        until: { type: "string", description: "End date", default: "now" },
        limit: { type: "number", description: "Number of results", default: 10 },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "analytics_pages_project",
    description: "Get analytics for a Pages project (deployments, requests)",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "The Pages project name" },
        since: { type: "string", description: "Start date", default: "-7d" },
        until: { type: "string", description: "End date", default: "now" },
      },
      required: ["projectName"],
    },
  },
  {
    name: "analytics_compare_zones",
    description: "Compare traffic across multiple zones",
    inputSchema: {
      type: "object",
      properties: {
        zoneIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of zone IDs to compare",
        },
        since: { type: "string", description: "Start date", default: "-7d" },
        until: { type: "string", description: "End date", default: "now" },
      },
      required: ["zoneIds"],
    },
  },
] as const;

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return String(n);
}

export async function handleAnalyticsTool(name: string, args: unknown) {
  try {
    const accountId = getAccountId();

    switch (name) {
      case "analytics_zone_traffic": {
        const { zoneId, since = "-7d", until = "now" } = zoneAnalyticsSchema.parse(args);

        // Use GraphQL Analytics API for detailed data
        const query = `
          query {
            viewer {
              zones(filter: { zoneTag: "${zoneId}" }) {
                httpRequests1dGroups(
                  limit: 30
                  filter: { date_geq: "${since}", date_leq: "${until}" }
                ) {
                  sum {
                    requests
                    cachedRequests
                    bytes
                    cachedBytes
                    threats
                    pageViews
                  }
                  uniq {
                    uniques
                  }
                }
              }
            }
          }
        `;

        try {
          interface GraphQLDayData {
            sum: {
              requests?: number;
              cachedRequests?: number;
              bytes?: number;
              cachedBytes?: number;
              threats?: number;
              pageViews?: number;
            };
            uniq: { uniques?: number };
          }
          const result = await cfFetch<{ viewer: { zones: Array<{ httpRequests1dGroups: GraphQLDayData[] }> } }>(
            `/graphql`,
            {
              method: "POST",
              body: JSON.stringify({ query }),
            }
          );

          const data = result.viewer?.zones?.[0]?.httpRequests1dGroups || [];
          const totals = data.reduce(
            (acc, day) => ({
              requests: acc.requests + (day.sum?.requests || 0),
              cachedRequests: acc.cachedRequests + (day.sum?.cachedRequests || 0),
              bytes: acc.bytes + (day.sum?.bytes || 0),
              cachedBytes: acc.cachedBytes + (day.sum?.cachedBytes || 0),
              threats: acc.threats + (day.sum?.threats || 0),
              pageViews: acc.pageViews + (day.sum?.pageViews || 0),
              uniques: acc.uniques + (day.uniq?.uniques || 0),
            }),
            { requests: 0, cachedRequests: 0, bytes: 0, cachedBytes: 0, threats: 0, pageViews: 0, uniques: 0 }
          );

          return jsonResult({
            period: { since, until },
            requests: {
              total: formatNumber(totals.requests),
              cached: formatNumber(totals.cachedRequests),
              uncached: formatNumber(totals.requests - totals.cachedRequests),
              cacheRate: `${((totals.cachedRequests / totals.requests) * 100).toFixed(1)}%`,
            },
            bandwidth: {
              total: formatBytes(totals.bytes),
              cached: formatBytes(totals.cachedBytes),
              uncached: formatBytes(totals.bytes - totals.cachedBytes),
              savedPercent: `${((totals.cachedBytes / totals.bytes) * 100).toFixed(1)}%`,
            },
            threats: formatNumber(totals.threats),
            pageViews: formatNumber(totals.pageViews),
            uniqueVisitors: formatNumber(totals.uniques),
          });
        } catch {
          // Fallback to REST API
          const analytics = await cfFetch<{ totals: ZoneAnalytics }>(
            `/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}`
          );
          return jsonResult(analytics.totals);
        }
      }

      case "analytics_zone_summary": {
        const { zoneId } = zoneIdSchema.parse(args);
        const analytics = await cfFetch<{ totals: ZoneAnalytics }>(
          `/zones/${zoneId}/analytics/dashboard?since=-1440&continuous=true`
        );
        const t = analytics.totals;
        return jsonResult({
          period: "Last 24 hours",
          requests: {
            total: formatNumber(t.requests?.all || 0),
            cached: formatNumber(t.requests?.cached || 0),
            cacheRate: t.requests?.all
              ? `${((t.requests.cached / t.requests.all) * 100).toFixed(1)}%`
              : "N/A",
          },
          bandwidth: {
            total: formatBytes(t.bandwidth?.all || 0),
            saved: formatBytes(t.bandwidth?.cached || 0),
          },
          security: {
            threatsBlocked: formatNumber(t.threats?.all || 0),
          },
          visitors: {
            unique: formatNumber(t.uniques?.all || 0),
            pageViews: formatNumber(t.pageviews?.all || 0),
          },
        });
      }

      case "analytics_top_paths": {
        const { zoneId, since = "-7d", until = "now", limit } = topPagesSchema.parse(args);

        // GraphQL query for top paths
        const query = `
          query {
            viewer {
              zones(filter: { zoneTag: "${zoneId}" }) {
                httpRequestsAdaptiveGroups(
                  limit: ${limit}
                  filter: { date_geq: "${since}", date_leq: "${until}" }
                  orderBy: [count_DESC]
                ) {
                  count
                  dimensions {
                    clientRequestPath
                  }
                }
              }
            }
          }
        `;

        try {
          const result = await cfFetch<{
            viewer: {
              zones: Array<{
                httpRequestsAdaptiveGroups: Array<{
                  count: number;
                  dimensions: { clientRequestPath: string };
                }>;
              }>;
            };
          }>(`/graphql`, {
            method: "POST",
            body: JSON.stringify({ query }),
          });

          const paths = result.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];
          return jsonResult({
            period: { since, until },
            topPaths: paths.map((p, i) => ({
              rank: i + 1,
              path: p.dimensions.clientRequestPath,
              requests: formatNumber(p.count),
            })),
          });
        } catch {
          return errorResult("Top paths analytics requires GraphQL API access");
        }
      }

      case "analytics_pages_project": {
        const { projectName, since = "-7d", until = "now" } = pagesAnalyticsSchema.parse(args);

        // Get deployment count
        const deployments = await cfFetch<Array<{ id: string }>>(
          `/accounts/${accountId}/pages/projects/${projectName}/deployments?per_page=100`
        );

        // Get project details for domain info
        const project = await cfFetch<{ subdomain: string; domains: string[] }>(
          `/accounts/${accountId}/pages/projects/${projectName}`
        );

        return jsonResult({
          project: projectName,
          period: { since, until },
          deployments: {
            total: deployments.length,
            note: "Showing last 100 deployments",
          },
          domains: {
            subdomain: `${project.subdomain}.pages.dev`,
            customDomains: project.domains,
          },
          tip: "For detailed traffic, use analytics_zone_traffic with the zone ID of your custom domain",
        });
      }

      case "analytics_compare_zones": {
        const schema = z.object({
          zoneIds: z.array(z.string()).min(1).max(10),
          since: z.string().optional().default("-7d"),
          until: z.string().optional().default("now"),
        });
        const { zoneIds, since, until } = schema.parse(args);

        const results = await Promise.all(
          zoneIds.map(async (zoneId) => {
            try {
              const [zone, analytics] = await Promise.all([
                cfFetch<{ name: string }>(`/zones/${zoneId}`),
                cfFetch<{ totals: ZoneAnalytics }>(
                  `/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}`
                ),
              ]);
              const t = analytics.totals;
              return {
                zoneId,
                name: zone.name,
                requests: formatNumber(t.requests?.all || 0),
                bandwidth: formatBytes(t.bandwidth?.all || 0),
                cacheRate: t.requests?.all
                  ? `${((t.requests.cached / t.requests.all) * 100).toFixed(1)}%`
                  : "N/A",
                threats: formatNumber(t.threats?.all || 0),
              };
            } catch (e) {
              return {
                zoneId,
                error: e instanceof Error ? e.message : "Failed to fetch",
              };
            }
          })
        );

        return jsonResult({
          period: { since, until },
          zones: results,
        });
      }

      default:
        return errorResult(`Unknown analytics tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
