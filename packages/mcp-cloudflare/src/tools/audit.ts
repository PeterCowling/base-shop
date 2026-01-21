import { z } from "zod";

import { cfFetch, getAccountId } from "../client.js";
import { errorResult, formatError,jsonResult, zoneIdSchema } from "../utils/validation.js";

interface ZoneSettings {
  id: string;
  value: string | boolean | number | Record<string, unknown>;
  modified_on?: string;
}

interface SecurityRecommendation {
  category: "critical" | "warning" | "info";
  setting: string;
  current: string;
  recommended: string;
  reason: string;
}

interface PerformanceRecommendation {
  category: "warning" | "info";
  setting: string;
  current: string;
  recommended: string;
  reason: string;
}

const auditZoneSchema = zoneIdSchema;
const auditAccountSchema = z.object({});

export const auditTools = [
  {
    name: "audit_zone_security",
    description: "Audit security settings for a zone and get recommendations",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID to audit" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "audit_zone_performance",
    description: "Audit performance settings for a zone and get recommendations",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID to audit" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "audit_zone_dns",
    description: "Audit DNS configuration for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID to audit" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "audit_zone_full",
    description: "Run a comprehensive audit of all zone settings",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID to audit" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "audit_pages_projects",
    description: "Audit all Pages projects for configuration issues",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "audit_account_overview",
    description: "Get an overview of account resources and potential issues",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
] as const;

async function getZoneSettings(zoneId: string): Promise<Map<string, ZoneSettings>> {
  const settings = await cfFetch<ZoneSettings[]>(`/zones/${zoneId}/settings`);
  return new Map(settings.map((s) => [s.id, s]));
}

function auditSecurity(settings: Map<string, ZoneSettings>): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  // SSL Mode
  const sslMode = settings.get("ssl")?.value as string;
  if (sslMode === "off") {
    recommendations.push({
      category: "critical",
      setting: "SSL Mode",
      current: "Off",
      recommended: "Full (Strict)",
      reason: "Traffic is completely unencrypted. Enable SSL immediately.",
    });
  } else if (sslMode === "flexible") {
    recommendations.push({
      category: "critical",
      setting: "SSL Mode",
      current: "Flexible",
      recommended: "Full (Strict)",
      reason: "Flexible SSL leaves origin-to-Cloudflare traffic unencrypted.",
    });
  } else if (sslMode === "full") {
    recommendations.push({
      category: "warning",
      setting: "SSL Mode",
      current: "Full",
      recommended: "Full (Strict)",
      reason: "Full mode doesn't validate origin certificate. Use Strict for complete security.",
    });
  }

  // Always Use HTTPS
  const alwaysHttps = settings.get("always_use_https")?.value;
  if (alwaysHttps !== "on") {
    recommendations.push({
      category: "warning",
      setting: "Always Use HTTPS",
      current: "Off",
      recommended: "On",
      reason: "HTTP traffic should be redirected to HTTPS.",
    });
  }

  // Minimum TLS Version
  const minTls = settings.get("min_tls_version")?.value as string;
  if (minTls === "1.0" || minTls === "1.1") {
    recommendations.push({
      category: "warning",
      setting: "Minimum TLS Version",
      current: minTls,
      recommended: "1.2",
      reason: "TLS 1.0 and 1.1 are deprecated and have known vulnerabilities.",
    });
  }

  // Security Level
  const securityLevel = settings.get("security_level")?.value as string;
  if (securityLevel === "essentially_off" || securityLevel === "low") {
    recommendations.push({
      category: "warning",
      setting: "Security Level",
      current: securityLevel,
      recommended: "Medium or High",
      reason: "Low security level may allow malicious traffic through.",
    });
  }

  // WAF
  const waf = settings.get("waf")?.value;
  if (waf !== "on") {
    recommendations.push({
      category: "info",
      setting: "Web Application Firewall",
      current: "Off",
      recommended: "On",
      reason: "WAF protects against common web vulnerabilities (requires paid plan).",
    });
  }

  // Bot Fight Mode
  const botFight = settings.get("bot_fight_mode")?.value;
  if (!botFight) {
    recommendations.push({
      category: "info",
      setting: "Bot Fight Mode",
      current: "Off",
      recommended: "On",
      reason: "Bot Fight Mode helps block malicious bots.",
    });
  }

  // HSTS
  const hsts = settings.get("security_header")?.value as Record<string, unknown> | undefined;
  if (!hsts?.strict_transport_security) {
    recommendations.push({
      category: "info",
      setting: "HTTP Strict Transport Security (HSTS)",
      current: "Not configured",
      recommended: "Enable with max-age >= 31536000",
      reason: "HSTS prevents protocol downgrade attacks.",
    });
  }

  return recommendations;
}

function auditPerformance(settings: Map<string, ZoneSettings>): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = [];

  // Brotli compression
  const brotli = settings.get("brotli")?.value;
  if (brotli !== "on") {
    recommendations.push({
      category: "warning",
      setting: "Brotli Compression",
      current: "Off",
      recommended: "On",
      reason: "Brotli provides better compression than gzip, reducing bandwidth.",
    });
  }

  // Early Hints
  const earlyHints = settings.get("early_hints")?.value;
  if (earlyHints !== "on") {
    recommendations.push({
      category: "info",
      setting: "Early Hints",
      current: "Off",
      recommended: "On",
      // eslint-disable-next-line ds/no-raw-font -- false positive: "times" is not a font
      reason: "Early Hints (103) can improve page load times.",
    });
  }

  // HTTP/2
  const http2 = settings.get("http2")?.value;
  if (http2 !== "on") {
    recommendations.push({
      category: "warning",
      setting: "HTTP/2",
      current: "Off",
      recommended: "On",
      reason: "HTTP/2 improves performance with multiplexing.",
    });
  }

  // HTTP/3
  const http3 = settings.get("http3")?.value;
  if (http3 !== "on") {
    recommendations.push({
      category: "info",
      setting: "HTTP/3 (QUIC)",
      current: "Off",
      recommended: "On",
      reason: "HTTP/3 provides faster connections, especially on mobile.",
    });
  }

  // Auto Minify
  const minify = settings.get("minify")?.value as Record<string, boolean> | undefined;
  if (!minify?.js || !minify?.css || !minify?.html) {
    const disabled = [];
    if (!minify?.js) disabled.push("JS");
    if (!minify?.css) disabled.push("CSS");
    if (!minify?.html) disabled.push("HTML");
    recommendations.push({
      category: "info",
      setting: "Auto Minify",
      current: `${disabled.join(", ")} disabled`,
      recommended: "Enable all",
      // eslint-disable-next-line ds/no-raw-font -- false positive: "times" is not a font
      reason: "Minification reduces file sizes and improves load times.",
    });
  }

  // Caching Level
  const cacheLevel = settings.get("cache_level")?.value as string;
  if (cacheLevel === "bypass" || cacheLevel === "basic") {
    recommendations.push({
      category: "warning",
      setting: "Caching Level",
      current: cacheLevel,
      recommended: "Standard or Aggressive",
      reason: "Better caching reduces origin load and improves performance.",
    });
  }

  // Browser Cache TTL
  const browserTtl = settings.get("browser_cache_ttl")?.value as number;
  if (browserTtl && browserTtl < 14400) {
    recommendations.push({
      category: "info",
      setting: "Browser Cache TTL",
      current: `${browserTtl} seconds`,
      recommended: "14400+ seconds (4 hours)",
      reason: "Longer browser caching reduces repeat requests.",
    });
  }

  return recommendations;
}

export async function handleAuditTool(name: string, args: unknown) {
  try {
    const accountId = getAccountId();

    switch (name) {
      case "audit_zone_security": {
        const { zoneId } = auditZoneSchema.parse(args);
        const [zone, settings] = await Promise.all([
          cfFetch<{ name: string }>(`/zones/${zoneId}`),
          getZoneSettings(zoneId),
        ]);
        const recommendations = auditSecurity(settings);

        const critical = recommendations.filter((r) => r.category === "critical");
        const warnings = recommendations.filter((r) => r.category === "warning");
        const info = recommendations.filter((r) => r.category === "info");

        return jsonResult({
          zone: zone.name,
          summary: {
            critical: critical.length,
            warnings: warnings.length,
            suggestions: info.length,
            score: recommendations.length === 0 ? "A+" : critical.length > 0 ? "F" : warnings.length > 2 ? "C" : "B",
          },
          critical,
          warnings,
          suggestions: info,
        });
      }

      case "audit_zone_performance": {
        const { zoneId } = auditZoneSchema.parse(args);
        const [zone, settings] = await Promise.all([
          cfFetch<{ name: string }>(`/zones/${zoneId}`),
          getZoneSettings(zoneId),
        ]);
        const recommendations = auditPerformance(settings);

        return jsonResult({
          zone: zone.name,
          summary: {
            optimizations: recommendations.length,
            score: recommendations.length === 0 ? "Optimized" : recommendations.length > 3 ? "Needs Work" : "Good",
          },
          recommendations,
        });
      }

      case "audit_zone_dns": {
        const { zoneId } = auditZoneSchema.parse(args);
        const [zone, records] = await Promise.all([
          cfFetch<{ name: string }>(`/zones/${zoneId}`),
          cfFetch<Array<{ type: string; name: string; content: string; proxied: boolean }>>(
            `/zones/${zoneId}/dns_records?per_page=100`
          ),
        ]);

        const issues: Array<{ type: string; issue: string; record?: string }> = [];

        // Check for common missing records
        const hasSpf = records.some((r) => r.type === "TXT" && r.content.includes("v=spf1"));
        const hasDmarc = records.some((r) => r.type === "TXT" && r.name.startsWith("_dmarc"));
        const hasMx = records.some((r) => r.type === "MX");

        if (!hasSpf) {
          issues.push({
            type: "warning",
            issue: "Missing SPF record",
            record: "Add TXT record with SPF policy to prevent email spoofing",
          });
        }
        if (!hasDmarc) {
          issues.push({
            type: "warning",
            issue: "Missing DMARC record",
            record: "Add _dmarc TXT record for email authentication",
          });
        }

        // Check for unproxied records that could be proxied
        const unproxied = records.filter(
          (r) => (r.type === "A" || r.type === "AAAA" || r.type === "CNAME") && !r.proxied
        );
        if (unproxied.length > 0) {
          issues.push({
            type: "info",
            issue: `${unproxied.length} record(s) not proxied through Cloudflare`,
            record: unproxied.map((r) => `${r.name} (${r.type})`).join(", "),
          });
        }

        return jsonResult({
          zone: zone.name,
          totalRecords: records.length,
          recordTypes: records.reduce(
            (acc, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          emailSecurity: {
            spf: hasSpf ? "Configured" : "Missing",
            dmarc: hasDmarc ? "Configured" : "Missing",
            mx: hasMx ? "Configured" : "Not configured",
          },
          issues,
        });
      }

      case "audit_zone_full": {
        const { zoneId } = auditZoneSchema.parse(args);
        const [zone, settings, records, analytics] = await Promise.all([
          cfFetch<{ name: string; status: string; plan: { name: string } }>(`/zones/${zoneId}`),
          getZoneSettings(zoneId),
          cfFetch<Array<{ type: string; proxied: boolean }>>(`/zones/${zoneId}/dns_records?per_page=100`),
          cfFetch<{ totals: { requests: { all: number }; bandwidth: { all: number } } }>(
            `/zones/${zoneId}/analytics/dashboard?since=-1440&continuous=true`
          ).catch(() => null),
        ]);

        const securityRecs = auditSecurity(settings);
        const perfRecs = auditPerformance(settings);

        const criticalCount = securityRecs.filter((r) => r.category === "critical").length;
        const warningCount = securityRecs.filter((r) => r.category === "warning").length + perfRecs.filter((r) => r.category === "warning").length;

        let overallGrade = "A";
        if (criticalCount > 0) overallGrade = "F";
        else if (warningCount > 4) overallGrade = "C";
        else if (warningCount > 2) overallGrade = "B";
        else if (warningCount > 0 || perfRecs.length > 0) overallGrade = "A-";

        return jsonResult({
          zone: zone.name,
          status: zone.status,
          plan: zone.plan.name,
          overallGrade,
          summary: {
            security: {
              critical: criticalCount,
              warnings: securityRecs.filter((r) => r.category === "warning").length,
              suggestions: securityRecs.filter((r) => r.category === "info").length,
            },
            performance: {
              optimizations: perfRecs.length,
            },
            dns: {
              totalRecords: records.length,
              proxied: records.filter((r) => r.proxied).length,
            },
          },
          traffic24h: analytics
            ? {
                requests: analytics.totals.requests.all,
                bandwidth: `${(analytics.totals.bandwidth.all / 1024 / 1024).toFixed(2)} MB`,
              }
            : "Analytics unavailable",
          topIssues: [
            ...securityRecs.filter((r) => r.category === "critical").slice(0, 3),
            ...securityRecs.filter((r) => r.category === "warning").slice(0, 2),
          ],
          performanceOptimizations: perfRecs.slice(0, 3),
        });
      }

      case "audit_pages_projects": {
        auditAccountSchema.parse(args);
        const projects = await cfFetch<
          Array<{
            name: string;
            subdomain: string;
            domains: string[];
            production_branch: string;
            latest_deployment?: { id: string; created_on: string; environment: string };
          }>
        >(`/accounts/${accountId}/pages/projects`);

        const audited = projects.map((p) => {
          const issues: string[] = [];

          if (!p.domains || p.domains.length === 0) {
            issues.push("No custom domain configured");
          }
          if (!p.latest_deployment) {
            issues.push("No deployments yet");
          }
          if (p.latest_deployment && p.latest_deployment.environment !== "production") {
            issues.push("Latest deployment is not production");
          }

          return {
            name: p.name,
            subdomain: `${p.subdomain}.pages.dev`,
            customDomains: p.domains?.length || 0,
            productionBranch: p.production_branch,
            lastDeployed: p.latest_deployment?.created_on || "Never",
            issues: issues.length > 0 ? issues : ["No issues found"],
          };
        });

        return jsonResult({
          totalProjects: projects.length,
          projectsWithIssues: audited.filter((p) => p.issues[0] !== "No issues found").length,
          projects: audited,
        });
      }

      case "audit_account_overview": {
        auditAccountSchema.parse(args);

        const [zones, pagesProjects, kvNamespaces, r2Buckets] = await Promise.all([
          cfFetch<Array<{ id: string; name: string; status: string }>>(`/zones`),
          cfFetch<Array<{ name: string }>>(`/accounts/${accountId}/pages/projects`),
          cfFetch<Array<{ id: string; title: string }>>(`/accounts/${accountId}/storage/kv/namespaces`),
          cfFetch<{ buckets: Array<{ name: string }> }>(`/accounts/${accountId}/r2/buckets`).catch(() => ({ buckets: [] })),
        ]);

        const activeZones = zones.filter((z) => z.status === "active");
        const pendingZones = zones.filter((z) => z.status === "pending");

        return jsonResult({
          summary: {
            zones: zones.length,
            pagesProjects: pagesProjects.length,
            kvNamespaces: kvNamespaces.length,
            r2Buckets: r2Buckets.buckets.length,
          },
          zones: {
            active: activeZones.length,
            pending: pendingZones.length,
            list: zones.map((z) => ({ name: z.name, status: z.status })),
          },
          pages: {
            total: pagesProjects.length,
            projects: pagesProjects.map((p) => p.name),
          },
          storage: {
            kvNamespaces: kvNamespaces.map((ns) => ns.title),
            r2Buckets: r2Buckets.buckets.map((b) => b.name),
          },
          recommendations: [
            ...(pendingZones.length > 0 ? [`${pendingZones.length} zone(s) pending activation - check nameserver configuration`] : []),
            ...(r2Buckets.buckets.length === 0 ? ["Consider using R2 for static assets and media storage"] : []),
          ],
        });
      }

      default:
        return errorResult(`Unknown audit tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
