import type { StartupState } from "./self-evolving-contracts.js";

export interface AutoFixResult {
  applied: boolean;
  reason: string;
  patched_startup_state: StartupState;
}

/**
 * First low-risk auto-fix class for website-v1:
 * ensure minimal brand do/dont rules exist so website-v1 preflight can proceed.
 */
export function applyWebsiteV1BrandRulesAutoFix(
  startupState: StartupState,
): AutoFixResult {
  const hasDoRules = startupState.brand.do_rules.length > 0;
  const hasDontRules = startupState.brand.dont_rules.length > 0;
  if (hasDoRules && hasDontRules) {
    return {
      applied: false,
      reason: "brand_rules_already_present",
      patched_startup_state: startupState,
    };
  }

  const patched: StartupState = {
    ...startupState,
    brand: {
      ...startupState.brand,
      do_rules: hasDoRules
        ? startupState.brand.do_rules
        : ["Keep claims factual and specific."],
      dont_rules: hasDontRules
        ? startupState.brand.dont_rules
        : ["Avoid unverified superlatives."],
    },
    updated_at: new Date().toISOString(),
  };
  return {
    applied: true,
    reason: "brand_rules_autofix_applied",
    patched_startup_state: patched,
  };
}
