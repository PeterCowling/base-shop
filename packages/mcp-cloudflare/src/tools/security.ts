import { z } from "zod";

import { cfFetch, cfFetchWithInfo } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
  paginationSchema,
  zoneIdSchema,
} from "../utils/validation.js";

interface FirewallRule {
  id: string;
  paused: boolean;
  description: string;
  action: string;
  priority: number;
  filter: {
    id: string;
    expression: string;
    paused: boolean;
  };
}

interface RateLimitRule {
  id: string;
  disabled: boolean;
  description: string;
  match: {
    request: {
      methods?: string[];
      schemes?: string[];
      url: string;
    };
    response?: {
      status?: number[];
      headers?: Array<{ name: string; op: string; value: string }>;
    };
  };
  threshold: number;
  period: number;
  action: {
    mode: string;
    timeout?: number;
    response?: {
      content_type: string;
      body: string;
    };
  };
}

interface WAFPackage {
  id: string;
  name: string;
  description: string;
  detection_mode: string;
  zone_id: string;
  status: string;
}

const listFirewallRulesSchema = zoneIdSchema.merge(paginationSchema);
const getFirewallRuleSchema = zoneIdSchema.extend({
  ruleId: z.string().min(1),
});

const listRateLimitsSchema = zoneIdSchema.merge(paginationSchema);

const listWAFPackagesSchema = zoneIdSchema;

const securityLevelSchema = zoneIdSchema.extend({
  level: z.enum(["off", "essentially_off", "low", "medium", "high", "under_attack"]).optional(),
});

export const securityTools = [
  {
    name: "security_list_firewall_rules",
    description: "List all firewall rules for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        page: { type: "number", default: 1 },
        perPage: { type: "number", default: 25 },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "security_get_firewall_rule",
    description: "Get details of a specific firewall rule",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        ruleId: { type: "string", description: "The firewall rule ID" },
      },
      required: ["zoneId", "ruleId"],
    },
  },
  {
    name: "security_list_rate_limits",
    description: "List all rate limiting rules for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        page: { type: "number", default: 1 },
        perPage: { type: "number", default: 25 },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "security_list_waf_packages",
    description: "List WAF packages/rulesets for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "security_get_level",
    description: "Get or set the security level for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        level: {
          type: "string",
          enum: ["off", "essentially_off", "low", "medium", "high", "under_attack"],
          description: "Security level to set (omit to just read current level)",
        },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "security_under_attack_mode",
    description: "Enable or disable Under Attack Mode for a zone. Requires confirm: true.",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
        enabled: { type: "boolean", description: "Enable (true) or disable (false) Under Attack Mode" },
        confirm: { type: "boolean", description: "⚠️ Set to true to change Under Attack Mode" },
      },
      required: ["zoneId", "enabled"],
    },
  },
  {
    name: "security_bot_fight_mode",
    description: "Get Bot Fight Mode status for a zone",
    inputSchema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID" },
      },
      required: ["zoneId"],
    },
  },
] as const;

export async function handleSecurityTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "security_list_firewall_rules": {
        const { zoneId, page, perPage } = listFirewallRulesSchema.parse(args);
        const { result, resultInfo } = await cfFetchWithInfo<FirewallRule[]>(
          `/zones/${zoneId}/firewall/rules?page=${page}&per_page=${perPage}`
        );

        return jsonResult({
          rules: result.map((r) => ({
            id: r.id,
            description: r.description,
            action: r.action,
            paused: r.paused,
            priority: r.priority,
            expression: r.filter?.expression,
          })),
          pagination: resultInfo,
        });
      }

      case "security_get_firewall_rule": {
        const { zoneId, ruleId } = getFirewallRuleSchema.parse(args);
        const rules = await cfFetch<FirewallRule[]>(
          `/zones/${zoneId}/firewall/rules/${ruleId}`
        );
        const rule = Array.isArray(rules) ? rules[0] : rules;

        return jsonResult({
          id: rule.id,
          description: rule.description,
          action: rule.action,
          paused: rule.paused,
          priority: rule.priority,
          filter: {
            id: rule.filter?.id,
            expression: rule.filter?.expression,
            paused: rule.filter?.paused,
          },
        });
      }

      case "security_list_rate_limits": {
        const { zoneId, page, perPage } = listRateLimitsSchema.parse(args);
        const { result, resultInfo } = await cfFetchWithInfo<RateLimitRule[]>(
          `/zones/${zoneId}/rate_limits?page=${page}&per_page=${perPage}`
        );

        return jsonResult({
          rateLimits: result.map((r) => ({
            id: r.id,
            description: r.description,
            disabled: r.disabled,
            match: {
              url: r.match?.request?.url,
              methods: r.match?.request?.methods,
            },
            threshold: r.threshold,
            period: r.period,
            action: r.action?.mode,
            actionTimeout: r.action?.timeout,
          })),
          pagination: resultInfo,
        });
      }

      case "security_list_waf_packages": {
        const { zoneId } = listWAFPackagesSchema.parse(args);
        const packages = await cfFetch<WAFPackage[]>(
          `/zones/${zoneId}/firewall/waf/packages`
        );

        return jsonResult({
          packages: packages.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            detectionMode: p.detection_mode,
            status: p.status,
          })),
        });
      }

      case "security_get_level": {
        const { zoneId, level } = securityLevelSchema.parse(args);

        if (level) {
          // Set security level
          await cfFetch<{ value: string }>(
            `/zones/${zoneId}/settings/security_level`,
            {
              method: "PATCH",
              body: JSON.stringify({ value: level }),
            }
          );

          return jsonResult({
            message: `✅ Security level set to: ${level}`,
            level,
          });
        }

        // Get current security level
        const setting = await cfFetch<{ value: string }>(
          `/zones/${zoneId}/settings/security_level`
        );

        return jsonResult({
          level: setting.value,
          description: getSecurityLevelDescription(setting.value),
        });
      }

      case "security_under_attack_mode": {
        const schema = zoneIdSchema.extend({
          enabled: z.boolean(),
          confirm: z.boolean().optional(),
        });
        const { zoneId, enabled, confirm } = schema.parse(args);

        // Get current status
        const current = await cfFetch<{ value: string }>(
          `/zones/${zoneId}/settings/security_level`
        );

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: enabled
              ? "⚠️ This will ENABLE Under Attack Mode. All visitors will see a challenge page for ~5 seconds. Use during DDoS attacks."
              : "⚠️ This will DISABLE Under Attack Mode and return to normal security level.",
            preview: {
              action: enabled ? "ENABLE UNDER ATTACK MODE" : "DISABLE UNDER ATTACK MODE",
              zoneId,
              currentLevel: current.value,
              newLevel: enabled ? "under_attack" : "high",
              impact: enabled
                ? "All visitors will see an interstitial page while being verified"
                : "Normal traffic flow will resume",
            },
            toExecute: { zoneId, enabled, confirm: true },
          });
        }

        const newLevel = enabled ? "under_attack" : "high";
        await cfFetch<{ value: string }>(
          `/zones/${zoneId}/settings/security_level`,
          {
            method: "PATCH",
            body: JSON.stringify({ value: newLevel }),
          }
        );

        return jsonResult({
          message: enabled
            ? "✅ Under Attack Mode ENABLED - all visitors will be challenged"
            : "✅ Under Attack Mode DISABLED - security level set to High",
          level: newLevel,
        });
      }

      case "security_bot_fight_mode": {
        const { zoneId } = zoneIdSchema.parse(args);

        try {
          const setting = await cfFetch<{ value: string }>(
            `/zones/${zoneId}/settings/bot_fight_mode`
          );

          return jsonResult({
            botFightMode: setting.value === "on",
            value: setting.value,
            description: "Bot Fight Mode challenges requests from known bot networks",
          });
        } catch {
          return jsonResult({
            botFightMode: "unknown",
            note: "Bot Fight Mode setting may not be available for this zone/plan",
          });
        }
      }

      default:
        return errorResult(`Unknown security tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}

function getSecurityLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    off: "No security challenges (not recommended)",
    essentially_off: "Only challenges the most threatening visitors",
    low: "Challenges only the most threatening visitors",
    medium: "Challenges visitors showing threatening behavior",
    high: "Challenges all visitors showing any threatening behavior",
    under_attack: "Maximum protection - challenges every visitor (use during DDoS)",
  };
  return descriptions[level] || "Unknown security level";
}
