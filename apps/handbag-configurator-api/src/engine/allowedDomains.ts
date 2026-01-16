import type { ProductConfigSchema, SelectionState } from "@acme/product-configurator";
import type { RuleDefinition } from "./types";

function matchesCondition(
  selections: SelectionState,
  condition: { key: string; in: string[] },
) {
  const value = selections[condition.key];
  return typeof value === "string" && condition.in.includes(value);
}

export function computeAllowedDomains(
  schema: ProductConfigSchema,
  selections: SelectionState,
  rules: RuleDefinition[],
) {
  const allowedDomains: Record<string, Set<string>> = {};
  const fullDomains: Record<string, string[]> = {};

  for (const property of schema.properties) {
    const values = property.values.map((value) => value.value);
    fullDomains[property.key] = values;
    allowedDomains[property.key] = new Set(values);
  }

  for (const rule of rules) {
    if (!matchesCondition(selections, rule.if)) continue;
    const current = allowedDomains[rule.then.key];
    if (!current) continue;

    if (rule.type === "requires" || rule.type === "restrictDomain") {
      const allowedSet = new Set(rule.then.in);
      for (const value of Array.from(current)) {
        if (!allowedSet.has(value)) current.delete(value);
      }
    }

    if (rule.type === "excludes") {
      for (const value of rule.then.in) current.delete(value);
    }
  }

  const delta: Record<string, string[]> = {};
  for (const [key, allowed] of Object.entries(allowedDomains)) {
    const full = fullDomains[key];
    const next = full.filter((value) => allowed.has(value));
    if (next.length !== full.length) {
      delta[key] = next;
    }
  }

  return delta;
}

