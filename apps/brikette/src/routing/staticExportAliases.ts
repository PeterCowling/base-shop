import {
  buildLocalizedStaticRedirectRules,
  type StaticRedirectRule,
} from "./staticExportRedirects";

export type StaticAliasPair = {
  sourceBasePath: string;
  targetBasePath: string;
};

const SOURCE_WILDCARD_SUFFIX = "/*";
const TARGET_SPLAT_SUFFIX = "/:splat";

function isWildcardRule(rule: StaticRedirectRule): boolean {
  return (
    rule.from.endsWith(SOURCE_WILDCARD_SUFFIX) &&
    rule.to.endsWith(TARGET_SPLAT_SUFFIX)
  );
}

function toAliasPair(rule: StaticRedirectRule): StaticAliasPair {
  return {
    sourceBasePath: rule.from.slice(0, -SOURCE_WILDCARD_SUFFIX.length),
    targetBasePath: rule.to.slice(0, -TARGET_SPLAT_SUFFIX.length),
  };
}

export function buildLocalizedStaticAliasPairs(
  rules: readonly StaticRedirectRule[] = buildLocalizedStaticRedirectRules()
): StaticAliasPair[] {
  const pairs: StaticAliasPair[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    if (!isWildcardRule(rule)) continue;

    const pair = toAliasPair(rule);
    const key = `${pair.sourceBasePath}->${pair.targetBasePath}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push(pair);
  }

  return pairs;
}
