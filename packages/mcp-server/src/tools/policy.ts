import { z } from "zod";

import { parseWave2Envelope } from "../lib/wave2-contracts.js";

export type ToolPermission = "read" | "guarded_write" | "unsafe_write";

export type ToolSideEffects =
  | "none"
  | "bos_write"
  | "filesystem_write"
  | "external_write"
  | "unknown";

export type ToolErrorCode =
  | "AUTH_FAILED"
  | "FORBIDDEN_STAGE"
  | "NOT_FOUND"
  | "CONFLICT_ENTITY_SHA"
  | "CONTRACT_MISMATCH"
  | "MISSING_ARTIFACT"
  | "UPSTREAM_UNAVAILABLE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export const toolPolicySchema = z.object({
  permission: z.enum(["read", "guarded_write", "unsafe_write"]),
  sideEffects: z.enum(["none", "bos_write", "filesystem_write", "external_write"]),
  allowedStages: z.array(z.string().min(1)).min(1),
  auditTag: z.string().min(1),
  contextRequired: z.array(z.string().min(1)).default([]),
  requiresEntitySha: z.boolean().optional().default(false),
  sensitiveFields: z.array(z.string().min(1)).default([]),
});

export type ToolPolicy = z.infer<typeof toolPolicySchema>;

export type ToolPolicyMap = Readonly<Record<string, ToolPolicy>>;

export type ToolErrorEnvelope = {
  code: ToolErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  correlationId?: string;
  auditTag?: string;
};

export type ToolCallResult = {
  content: ReadonlyArray<{ type: "text"; text: string }>;
  isError?: boolean;
};

type PolicyMode = "strict" | "legacy_compat" | "unknown";

type PolicyResolution =
  | {
      mode: "strict";
      policy: ToolPolicy;
    }
  | {
      mode: "legacy_compat";
      policy: {
        permission: "read";
        sideEffects: "unknown";
        allowedStages: readonly ["*"];
        auditTag: string;
        contextRequired: readonly [];
        requiresEntitySha: boolean;
        sensitiveFields: readonly string[];
      };
    }
  | {
      mode: "unknown";
    };

const STRICT_TOOL_PREFIXES = ["bos_", "loop_"] as const;

const DEFAULT_SENSITIVE_FIELDS = [
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "apiKey",
  "x-agent-api-key",
  "password",
  "secret",
  "clientSecret",
  "baseEntitySha",
] as const;

const WARNED_LEGACY_TOOLS = new Set<string>();

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrictScopeTool(toolName: string): boolean {
  return STRICT_TOOL_PREFIXES.some((prefix) => toolName.startsWith(prefix));
}

function isKnownTool(toolName: string, knownToolNames: ReadonlySet<string>): boolean {
  return knownToolNames.has(toolName);
}

function createLegacyCompatibilityPolicy(toolName: string) {
  return {
    permission: "read" as const,
    sideEffects: "unknown" as const,
    allowedStages: ["*"] as const,
    auditTag: `legacy:${toolName}`,
    contextRequired: [] as const,
    requiresEntitySha: false,
    sensitiveFields: [...DEFAULT_SENSITIVE_FIELDS],
  };
}

export function resolveToolPolicy(
  toolName: string,
  knownToolNames: ReadonlySet<string>,
  policyMap: ToolPolicyMap
): PolicyResolution {
  const explicitPolicy = policyMap[toolName];
  if (explicitPolicy) {
    return {
      mode: "strict",
      policy: explicitPolicy,
    };
  }

  if (isStrictScopeTool(toolName)) {
    return { mode: "unknown" };
  }

  if (isKnownTool(toolName, knownToolNames)) {
    return {
      mode: "legacy_compat",
      policy: createLegacyCompatibilityPolicy(toolName),
    };
  }

  return {
    mode: "unknown",
  };
}

function makeErrorResult(error: ToolErrorEnvelope): ToolCallResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error }, null, 2) }],
    isError: true,
  };
}

function makeContractMismatch(message: string, details?: Record<string, unknown>): ToolCallResult {
  return makeErrorResult({
    code: "CONTRACT_MISMATCH",
    message,
    retryable: false,
    details,
  });
}

export function preflightWave2Envelope(input: unknown): ToolCallResult | null {
  try {
    parseWave2Envelope(input);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return makeContractMismatch("Wave-2 envelope validation failed.", {
        issues: error.issues,
      });
    }

    return makeContractMismatch("Wave-2 envelope validation failed.", {
      error: String(error),
    });
  }
}

function makeForbiddenStage(
  toolName: string,
  stage: string,
  allowedStages: ReadonlyArray<string>
): ToolCallResult {
  return makeErrorResult({
    code: "FORBIDDEN_STAGE",
    message: `Tool ${toolName} is not allowed during stage ${stage}.`,
    retryable: false,
    details: {
      current_stage: stage,
      allowed_stages: allowedStages,
    },
  });
}

export function redactSensitiveFields(input: unknown, sensitiveFields: ReadonlyArray<string>): unknown {
  if (!isObjectRecord(input)) {
    return input;
  }

  const normalizedSensitive = new Set(
    [...DEFAULT_SENSITIVE_FIELDS, ...sensitiveFields].map((key) => key.toLowerCase())
  );

  const redactValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => redactValue(item));
    }

    if (!isObjectRecord(value)) {
      return value;
    }

    const redactedEntries = Object.entries(value).map(([key, nestedValue]) => {
      if (normalizedSensitive.has(key.toLowerCase())) {
        return [key, "[REDACTED]"] as const;
      }
      return [key, redactValue(nestedValue)] as const;
    });

    return Object.fromEntries(redactedEntries);
  };

  return redactValue(input);
}

function warnLegacyCompatibility(toolName: string, args: unknown) {
  if (WARNED_LEGACY_TOOLS.has(toolName)) {
    return;
  }

  WARNED_LEGACY_TOOLS.add(toolName);
  const redactedArgs = redactSensitiveFields(args, DEFAULT_SENSITIVE_FIELDS);

  console.warn(
    "[mcp-policy] legacy compatibility mode",
    JSON.stringify(
      {
        tool: toolName,
        enforcementScope: "legacy_compat",
        permission: "read",
        sideEffects: "unknown",
        args: redactedArgs,
      },
      null,
      2
    )
  );
}

function validateStrictContext(
  toolName: string,
  policy: ToolPolicy,
  args: unknown
): ToolCallResult | null {
  if (!isObjectRecord(args)) {
    return makeContractMismatch(`Tool ${toolName} requires object arguments.`);
  }

  for (const field of policy.contextRequired) {
    const value = args[field];
    if (value === undefined || value === null || value === "") {
      return makeContractMismatch(`Tool ${toolName} requires context field ${field}.`, {
        missing_field: field,
      });
    }
  }

  const stageValue = args.current_stage;
  if (typeof stageValue !== "string" || stageValue.length === 0) {
    return makeContractMismatch(`Tool ${toolName} requires context field current_stage.`);
  }

  if (!policy.allowedStages.includes(stageValue)) {
    return makeForbiddenStage(toolName, stageValue, policy.allowedStages);
  }

  if (policy.permission === "guarded_write") {
    const reason = args.write_reason;
    if (typeof reason !== "string" || reason.trim().length === 0) {
      return makeContractMismatch(`Tool ${toolName} requires non-empty write_reason.`);
    }
  }

  if (policy.requiresEntitySha) {
    const entitySha = args.baseEntitySha;
    if (typeof entitySha !== "string" || entitySha.trim().length === 0) {
      return makeContractMismatch(`Tool ${toolName} requires non-empty baseEntitySha.`);
    }
  }

  return null;
}

export function preflightToolCallPolicy(params: {
  toolName: string;
  args: unknown;
  knownToolNames: ReadonlySet<string>;
  policyMap: ToolPolicyMap;
}): ToolCallResult | null {
  const { toolName, args, knownToolNames, policyMap } = params;
  const resolution = resolveToolPolicy(toolName, knownToolNames, policyMap);

  if (resolution.mode === "unknown") {
    if (isStrictScopeTool(toolName)) {
      return makeContractMismatch(
        `Tool ${toolName} is in strict scope and must declare policy metadata.`,
        {
          enforcementScope: "startup_loop_only",
          required: [
            "permission",
            "sideEffects",
            "allowedStages",
            "auditTag",
            "contextRequired",
            "sensitiveFields",
          ],
        }
      );
    }
    return null;
  }

  if (resolution.mode === "legacy_compat") {
    warnLegacyCompatibility(toolName, args);
    return null;
  }

  return validateStrictContext(toolName, resolution.policy, args);
}

export function parsePolicyMap(input: Record<string, unknown>): ToolPolicyMap {
  const entries = Object.entries(input).map(([toolName, value]) => {
    return [toolName, toolPolicySchema.parse(value)] as const;
  });

  return Object.fromEntries(entries);
}

export function getPolicyMode(
  toolName: string,
  knownToolNames: ReadonlySet<string>,
  policyMap: ToolPolicyMap
): PolicyMode {
  return resolveToolPolicy(toolName, knownToolNames, policyMap).mode;
}
