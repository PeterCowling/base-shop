import type {
  ProductConfigSchema,
  SelectionState,
  ValidateResponse,
} from "@acme/product-configurator";
import { computeAllowedDomains } from "./allowedDomains";
import { normalizeSelections } from "./normalize";
import type { RuleDefinition } from "./types";

type InvalidReason = { code: string; message: string };

function matchesCondition(
  selections: SelectionState,
  condition: { key: string; in: string[] },
) {
  const value = selections[condition.key];
  return typeof value === "string" && condition.in.includes(value);
}

function buildInvalidReasons(
  schema: ProductConfigSchema,
  invalidKeys: string[],
): InvalidReason[] {
  if (!invalidKeys.length) return [];
  const labels = new Map(
    schema.properties.map((property) => [property.key, property.displayName]),
  );
  return invalidKeys.map((key) => ({
    code: "INVALID_SELECTION",
    message: `Invalid value for ${labels.get(key) ?? key}.`,
  }));
}

export function validateSelections({
  schema,
  rules,
  selections,
}: {
  schema: ProductConfigSchema;
  rules: RuleDefinition[];
  selections: SelectionState;
}): ValidateResponse {
  const { normalizedSelections, invalidKeys } = normalizeSelections(
    schema,
    selections,
  );
  const blockedReasons: InvalidReason[] = buildInvalidReasons(
    schema,
    invalidKeys,
  );

  for (const rule of rules) {
    if (!matchesCondition(normalizedSelections, rule.if)) continue;
    const value = normalizedSelections[rule.then.key];
    if (rule.type === "requires" || rule.type === "restrictDomain") {
      if (!rule.then.in.includes(value)) {
        blockedReasons.push({ code: rule.code, message: rule.message });
      }
      continue;
    }
    if (rule.type === "excludes" && rule.then.in.includes(value)) {
      blockedReasons.push({ code: rule.code, message: rule.message });
    }
  }

  const allowedDomainsDelta = computeAllowedDomains(
    schema,
    normalizedSelections,
    rules,
  );

  return {
    valid: blockedReasons.length === 0,
    normalizedSelections,
    blockedReasons,
    allowedDomainsDelta,
  };
}

export function allowedNext({
  schema,
  rules,
  selections,
}: {
  schema: ProductConfigSchema;
  rules: RuleDefinition[];
  selections: SelectionState;
}) {
  const { normalizedSelections } = normalizeSelections(schema, selections);
  return {
    allowedDomainsDelta: computeAllowedDomains(
      schema,
      normalizedSelections,
      rules,
    ),
  };
}

