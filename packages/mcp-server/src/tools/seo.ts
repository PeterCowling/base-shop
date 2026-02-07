import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

export const seoTools = [
  {
    name: "seo_list_audits",
    description: "List all SEO audits for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of audits to return (default: 20)",
        },
      },
      required: ["shop"],
    },
  },
  {
    name: "seo_get_latest",
    description: "Get the most recent SEO audit for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
      },
      required: ["shop"],
    },
  },
  {
    name: "seo_summary",
    description: "Get SEO audit summary with trends over time",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
      },
      required: ["shop"],
    },
  },
] as const;

export async function handleSeoTool(name: string, args: unknown) {
  try {
    const params = (args || {}) as Record<string, unknown>;

    switch (name) {
      case "seo_list_audits": {
        const shop = params.shop as string;
        if (!shop) {
          return errorResult("Shop ID is required");
        }

        const limit = (params.limit as number) || 20;
        const { readSeoAudits } = await import(
          "@acme/platform-core/repositories/seoAudit.server"
        );

        const audits = await readSeoAudits(shop);
        const sorted = audits.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const limited = sorted.slice(0, limit);

        return jsonResult({
          shop,
          audits: limited.map((a) => ({
            timestamp: a.timestamp,
            score: a.score,
            recommendationCount: a.recommendations?.length || 0,
          })),
          total: audits.length,
          returned: limited.length,
        });
      }

      case "seo_get_latest": {
        const shop = params.shop as string;
        if (!shop) {
          return errorResult("Shop ID is required");
        }

        const { readSeoAudits } = await import(
          "@acme/platform-core/repositories/seoAudit.server"
        );

        const audits = await readSeoAudits(shop);
        if (audits.length === 0) {
          return jsonResult({
            shop,
            audit: null,
            message: "No SEO audits found for this shop",
          });
        }

        const sorted = audits.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const latest = sorted[0];

        // Categorize recommendations
        const recommendations = latest.recommendations || [];
        const categories: Record<string, string[]> = {
          critical: [],
          warning: [],
          info: [],
        };

        for (const rec of recommendations) {
          const lower = rec.toLowerCase();
          if (
            lower.includes("missing") ||
            lower.includes("broken") ||
            lower.includes("error")
          ) {
            categories.critical.push(rec);
          } else if (
            lower.includes("should") ||
            lower.includes("consider") ||
            lower.includes("improve")
          ) {
            categories.warning.push(rec);
          } else {
            categories.info.push(rec);
          }
        }

        return jsonResult({
          shop,
          audit: {
            timestamp: latest.timestamp,
            score: latest.score,
            scoreLabel: getScoreLabel(latest.score),
            recommendations: latest.recommendations,
            categorized: categories,
          },
        });
      }

      case "seo_summary": {
        const shop = params.shop as string;
        if (!shop) {
          return errorResult("Shop ID is required");
        }

        const { readSeoAudits } = await import(
          "@acme/platform-core/repositories/seoAudit.server"
        );

        const audits = await readSeoAudits(shop);
        if (audits.length === 0) {
          return jsonResult({
            shop,
            summary: null,
            message: "No SEO audits found for this shop",
          });
        }

        const sorted = audits.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const latest = sorted[0];
        const scores = sorted.map((a) => a.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Calculate trend
        let trend: "improving" | "declining" | "stable" = "stable";
        if (sorted.length >= 2) {
          const recent = sorted.slice(0, Math.min(3, sorted.length));
          const older = sorted.slice(Math.min(3, sorted.length));
          if (older.length > 0) {
            const recentAvg =
              recent.reduce((a, b) => a + b.score, 0) / recent.length;
            const olderAvg =
              older.reduce((a, b) => a + b.score, 0) / older.length;
            if (recentAvg > olderAvg + 5) trend = "improving";
            else if (recentAvg < olderAvg - 5) trend = "declining";
          }
        }

        // Count recommendation frequency
        const recCounts: Record<string, number> = {};
        for (const audit of sorted.slice(0, 10)) {
          for (const rec of audit.recommendations || []) {
            recCounts[rec] = (recCounts[rec] || 0) + 1;
          }
        }
        const recurring = Object.entries(recCounts)
          .filter(([_, count]) => count >= 2)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([rec, count]) => ({ recommendation: rec, occurrences: count }));

        return jsonResult({
          shop,
          summary: {
            latestScore: latest.score,
            latestScoreLabel: getScoreLabel(latest.score),
            latestTimestamp: latest.timestamp,
            averageScore: Math.round(avgScore * 10) / 10,
            trend,
            totalAudits: audits.length,
            highScore: Math.max(...scores),
            lowScore: Math.min(...scores),
            recurringIssues: recurring,
          },
        });
      }

      default:
        return errorResult(`Unknown SEO tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Poor";
}
