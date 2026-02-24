import { parseColorValue } from "./themeValidation/colorParser";
import { DEFAULT_THEME_CONTRAST_REQUIREMENTS, isColorTokenKey, isCssCustomPropertyName } from "./themeValidation/constants";
import { evaluateThemeContrastPair } from "./themeValidation/contrast";
import type {
  ThemeContrastRequirement,
  ThemeTokenValidationIssue,
  ThemeTokenValidationOptions,
  ThemeTokenValidationResult,
} from "./themeValidation/types";

export type {
  ThemeContrastRequirement,
  ThemeTokenValidationIssue,
  ThemeTokenValidationOptions,
  ThemeTokenValidationResult,
} from "./themeValidation/types";

export { DEFAULT_THEME_CONTRAST_REQUIREMENTS, evaluateThemeContrastPair };

export class ThemeTokenValidationError extends Error {
  readonly result: ThemeTokenValidationResult;

  constructor(context: string, result: ThemeTokenValidationResult) {
    const preview = result.errors
      .slice(0, 3)
      .map((issue) => issue.message)
      .join("; ");
    const suffix = result.errors.length > 3 ? ` (+${result.errors.length - 3} more)` : "";
    super(`Theme validation failed for ${context}: ${preview}${suffix}`);
    this.name = "ThemeTokenValidationError";
    this.result = result;
  }
}

export function diffThemeTokenKeys(
  previousTokens: Record<string, string>,
  nextTokens: Record<string, string>,
): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(previousTokens), ...Object.keys(nextTokens)]);
  for (const key of allKeys) {
    if (previousTokens[key] !== nextTokens[key]) {
      changed.push(key);
    }
  }
  return changed;
}

export function validateThemeTokens(
  tokens: Record<string, string>,
  options: ThemeTokenValidationOptions = {},
): ThemeTokenValidationResult {
  const issues: ThemeTokenValidationIssue[] = [];
  const allowedTokenKeys = options.allowedTokenKeys
    ? new Set(options.allowedTokenKeys)
    : null;
  const changedTokenKeys = options.changedTokenKeys
    ? new Set(options.changedTokenKeys)
    : null;
  const contrastRequirements =
    options.contrastRequirements ?? DEFAULT_THEME_CONTRAST_REQUIREMENTS;
  const baselineTokens = options.baselineTokens;
  const unresolvedColorReferenceSeverity =
    options.unresolvedColorReferenceSeverity ?? "warning";
  const unresolvableContrastPairSeverity =
    options.unresolvableContrastPairSeverity ?? "warning";

  for (const [token, rawValue] of Object.entries(tokens)) {
    if (!isCssCustomPropertyName(token)) {
      issues.push({
        type: "invalid_token_name",
        severity: "error",
        token,
        message: `Token key "${token}" must start with "--".`,
      });
    }

    if (allowedTokenKeys && !allowedTokenKeys.has(token)) {
      issues.push({
        type: "unknown_token",
        severity: options.enforceAllowedTokenKeys ? "error" : "warning",
        token,
        message: `Token "${token}" is not part of the selected theme defaults.`,
      });
    }

    if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
      issues.push({
        type: "empty_value",
        severity: "error",
        token,
        message: `Token "${token}" has an empty value.`,
      });
      continue;
    }

    if (isColorTokenKey(token)) {
      const parsed = parseColorValue(rawValue, tokens, new Set([token]));
      if (!parsed) {
        issues.push({
          type: "invalid_color_value",
          severity: "error",
          token,
          message: `Token "${token}" has an invalid color value "${rawValue}".`,
        });
      } else if ("unresolvedToken" in parsed) {
        issues.push({
          type: "unresolved_color_reference",
          severity: unresolvedColorReferenceSeverity,
          token,
          message: `Token "${token}" references unknown token "${parsed.unresolvedToken}".`,
        });
      }
    }
  }

  let contrastChecksPerformed = 0;
  for (const requirement of contrastRequirements) {
    const pairEvaluation = evaluateThemeContrastPair(tokens, requirement);
    if (pairEvaluation.ratio == null) {
      const hasRelevantTokens =
        requirement.foregroundToken in tokens && requirement.backgroundToken in tokens;
      if (hasRelevantTokens) {
        issues.push({
          type: "unresolvable_contrast_pair",
          severity: unresolvableContrastPairSeverity,
          foregroundToken: requirement.foregroundToken,
          backgroundToken: requirement.backgroundToken,
          minimumContrast: requirement.minimumContrast,
          message:
            pairEvaluation.reason ??
            `Unable to evaluate contrast for ${requirement.foregroundToken} on ${requirement.backgroundToken}.`,
        });
      }
      continue;
    }

    contrastChecksPerformed += 1;
    if (pairEvaluation.ratio >= requirement.minimumContrast) {
      continue;
    }

    const warningOnly = shouldDowngradeLowContrastToWarning({
      requirement,
      pairRatio: pairEvaluation.ratio,
      baselineTokens,
      changedTokenKeys,
    });

    issues.push({
      type: "low_contrast",
      severity: warningOnly ? "warning" : "error",
      foregroundToken: requirement.foregroundToken,
      backgroundToken: requirement.backgroundToken,
      contrast: pairEvaluation.ratio,
      minimumContrast: requirement.minimumContrast,
      message: `${requirement.label} is ${pairEvaluation.ratio.toFixed(2)}:1 (minimum ${requirement.minimumContrast}:1).`,
    });
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    contrastChecksPerformed,
  };
}

export function assertValidThemeTokens(
  tokens: Record<string, string>,
  options: ThemeTokenValidationOptions = {},
): ThemeTokenValidationResult {
  const result = validateThemeTokens(tokens, options);
  if (result.errors.length === 0) return result;
  const context = options.context ?? "theme tokens";
  throw new ThemeTokenValidationError(context, result);
}

function shouldDowngradeLowContrastToWarning({
  requirement,
  pairRatio,
  baselineTokens,
  changedTokenKeys,
}: {
  requirement: ThemeContrastRequirement;
  pairRatio: number;
  baselineTokens?: Record<string, string>;
  changedTokenKeys: Set<string> | null;
}): boolean {
  const pairChanged =
    !changedTokenKeys ||
    changedTokenKeys.has(requirement.foregroundToken) ||
    changedTokenKeys.has(requirement.backgroundToken);
  if (!pairChanged) return true;
  if (!baselineTokens) return false;

  const baseline = evaluateThemeContrastPair(baselineTokens, requirement);
  if (baseline.ratio == null) return false;
  return baseline.ratio < requirement.minimumContrast && pairRatio < requirement.minimumContrast;
}
