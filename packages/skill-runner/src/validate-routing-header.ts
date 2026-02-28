import { readFileSync } from "node:fs";

import yaml from "js-yaml";

import { getFrontmatterString, parseFrontmatter } from "./markdown.js";

export interface RoutingValidationError {
  field: string;
  message: string;
}

export interface RoutingValidationResult {
  valid: boolean;
  expectedCanonicalType: string | null;
  expectedPrimaryExecutionSkill: string | null;
  errors: RoutingValidationError[];
}

interface RoutingConfig {
  deliverable_families?: Record<
    string,
    {
      canonical_type?: string;
      primary_execution_skill?: string;
      required_channel?: boolean;
      channels?: Record<
        string,
        { canonical_type?: string; primary_execution_skill?: string }
      >;
      required_subtype?: boolean;
      subtypes?: Record<
        string,
        { canonical_type?: string; primary_execution_skill?: string }
      >;
    }
  >;
  startup_alias_mapping?: Record<
    string,
    { canonical_type?: string; primary_execution_skill?: string }
  >;
}

const DEFAULT_ROUTING_CONFIG_PATH =
  ".claude/skills/lp-do-fact-find/routing/deliverable-routing.yaml";

export function validateRoutingHeader(
  factFindMarkdown: string,
  routingConfigPath = DEFAULT_ROUTING_CONFIG_PATH,
): RoutingValidationResult {
  const errors: RoutingValidationError[] = [];
  const parsed = parseFrontmatter(factFindMarkdown);
  const frontmatter = parsed.frontmatter;

  const family = getFrontmatterString(frontmatter, "Deliverable-Family");
  const channel = getFrontmatterString(frontmatter, "Deliverable-Channel");
  const subtype = getFrontmatterString(frontmatter, "Deliverable-Subtype");
  const deliverableType = getFrontmatterString(frontmatter, "Deliverable-Type");
  const primarySkill = getFrontmatterString(frontmatter, "Primary-Execution-Skill");
  const startupAlias =
    getFrontmatterString(frontmatter, "Startup-Deliverable-Alias") ?? "none";

  const config = loadRoutingConfig(routingConfigPath);
  const resolved = resolveExpectedRouting({
    config,
    startupAlias,
    family,
    channel,
    subtype,
  });
  errors.push(...resolved.errors);
  const expectedCanonicalType = resolved.canonicalType;
  const expectedPrimarySkill = resolved.primarySkill;

  if (expectedCanonicalType && deliverableType !== expectedCanonicalType) {
    errors.push({
      field: "Deliverable-Type",
      message: `Expected "${expectedCanonicalType}" from routing config; found "${deliverableType ?? "missing"}".`,
    });
  }

  if (expectedPrimarySkill && normalizeSkill(primarySkill) !== expectedPrimarySkill) {
    errors.push({
      field: "Primary-Execution-Skill",
      message: `Expected "${expectedPrimarySkill}" from routing config; found "${primarySkill ?? "missing"}".`,
    });
  }

  return {
    valid: errors.length === 0,
    expectedCanonicalType,
    expectedPrimaryExecutionSkill: expectedPrimarySkill,
    errors,
  };
}

function normalizeSkill(value: string | null): string {
  if (!value) {
    return "";
  }
  return value.trim().replace(/^\//, "");
}

function resolveExpectedRouting(input: {
  config: RoutingConfig;
  startupAlias: string;
  family: string | null;
  channel: string | null;
  subtype: string | null;
}): {
  canonicalType: string | null;
  primarySkill: string | null;
  errors: RoutingValidationError[];
} {
  const errors: RoutingValidationError[] = [];
  const aliasResult = resolveFromStartupAlias(input.config, input.startupAlias);
  if (aliasResult) {
    if (aliasResult.error) {
      errors.push(aliasResult.error);
      return { canonicalType: null, primarySkill: null, errors };
    }
    return {
      canonicalType: aliasResult.canonicalType,
      primarySkill: aliasResult.primarySkill,
      errors,
    };
  }

  const familyResult = resolveFromFamily(
    input.config,
    input.family,
    input.channel,
    input.subtype,
  );
  errors.push(...familyResult.errors);
  return {
    canonicalType: familyResult.canonicalType,
    primarySkill: familyResult.primarySkill,
    errors,
  };
}

function resolveFromStartupAlias(
  config: RoutingConfig,
  startupAlias: string,
):
  | null
  | {
      canonicalType: string | null;
      primarySkill: string | null;
      error?: RoutingValidationError;
    } {
  const normalizedAlias = startupAlias.trim().toLowerCase();
  if (normalizedAlias === "none") {
    return null;
  }
  const startup = config.startup_alias_mapping?.[normalizedAlias];
  if (!startup) {
    return {
      canonicalType: null,
      primarySkill: null,
      error: {
        field: "Startup-Deliverable-Alias",
        message: `Unknown startup alias "${startupAlias}".`,
      },
    };
  }
  return {
    canonicalType: startup.canonical_type ?? null,
    primarySkill: startup.primary_execution_skill ?? null,
  };
}

function resolveFromFamily(
  config: RoutingConfig,
  family: string | null,
  channel: string | null,
  subtype: string | null,
): {
  canonicalType: string | null;
  primarySkill: string | null;
  errors: RoutingValidationError[];
} {
  const errors: RoutingValidationError[] = [];
  if (!family) {
    errors.push({
      field: "Deliverable-Family",
      message: "Deliverable-Family is required.",
    });
    return { canonicalType: null, primarySkill: null, errors };
  }

  const familyRule = config.deliverable_families?.[family];
  if (!familyRule) {
    errors.push({
      field: "Deliverable-Family",
      message: `Unknown deliverable family "${family}".`,
    });
    return { canonicalType: null, primarySkill: null, errors };
  }

  if (familyRule.required_channel) {
    return resolveFromChannel(family, channel, familyRule.channels);
  }
  if (familyRule.required_subtype) {
    return resolveFromSubtype(family, subtype, familyRule.subtypes);
  }

  return {
    canonicalType: familyRule.canonical_type ?? null,
    primarySkill: familyRule.primary_execution_skill ?? null,
    errors,
  };
}

function resolveFromChannel(
  family: string,
  channel: string | null,
  channels:
    | Record<string, { canonical_type?: string; primary_execution_skill?: string }>
    | undefined,
): {
  canonicalType: string | null;
  primarySkill: string | null;
  errors: RoutingValidationError[];
} {
  const errors: RoutingValidationError[] = [];
  if (!channel || channel === "none") {
    errors.push({
      field: "Deliverable-Channel",
      message: `Channel is required for deliverable family "${family}".`,
    });
    return { canonicalType: null, primarySkill: null, errors };
  }
  const rule = channels?.[channel];
  if (!rule) {
    errors.push({
      field: "Deliverable-Channel",
      message: `Unknown channel "${channel}" for family "${family}".`,
    });
    return { canonicalType: null, primarySkill: null, errors };
  }
  return {
    canonicalType: rule.canonical_type ?? null,
    primarySkill: rule.primary_execution_skill ?? null,
    errors,
  };
}

function resolveFromSubtype(
  family: string,
  subtype: string | null,
  subtypes:
    | Record<string, { canonical_type?: string; primary_execution_skill?: string }>
    | undefined,
): {
  canonicalType: string | null;
  primarySkill: string | null;
  errors: RoutingValidationError[];
} {
  const errors: RoutingValidationError[] = [];
  if (!subtype || subtype === "none") {
    errors.push({
      field: "Deliverable-Subtype",
      message: `Subtype is required for deliverable family "${family}".`,
    });
    return { canonicalType: null, primarySkill: null, errors };
  }
  const rule = subtypes?.[subtype];
  if (!rule) {
    errors.push({
      field: "Deliverable-Subtype",
      message: `Unknown subtype "${subtype}" for family "${family}".`,
    });
    return { canonicalType: null, primarySkill: null, errors };
  }
  return {
    canonicalType: rule.canonical_type ?? null,
    primarySkill: rule.primary_execution_skill ?? null,
    errors,
  };
}

function loadRoutingConfig(configPath: string): RoutingConfig {
  const parsed = yaml.load(readFileSync(configPath, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object") {
    return {};
  }
  return parsed as RoutingConfig;
}
