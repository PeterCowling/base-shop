/* i18n-exempt file -- PP-1100 internal pipeline cooldown policy [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/cooldown.ts

import type { TriageResult } from "./triage";

export type CooldownSeverity =
  | "permanent"
  | "long_cooldown"
  | "short_cooldown";

export type CooldownPlan = {
  reasonCode: string;
  severity: CooldownSeverity;
  recheckAfter: string | null;
  whatWouldChange: string;
};

type CooldownPolicy = {
  severity: CooldownSeverity;
  days: number | null;
  whatWouldChange: string;
};

const DEFAULT_POLICY: Record<CooldownSeverity, CooldownPolicy> = {
  permanent: {
    severity: "permanent",
    days: null,
    whatWouldChange: "Policy or compliance change required.",
  },
  long_cooldown: {
    severity: "long_cooldown",
    days: 120,
    whatWouldChange: "Improve economics or supplier terms before recheck.",
  },
  short_cooldown: {
    severity: "short_cooldown",
    days: 21,
    whatWouldChange: "Provide stronger market or sourcing signal.",
  },
};

const REASON_POLICIES: Record<string, CooldownPolicy> = {
  hazmat_keyword: {
    severity: "permanent",
    days: null,
    whatWouldChange: "Compliance clearance and hazmat handling plan required.",
  },
  policy_blocked: {
    severity: "permanent",
    days: null,
    whatWouldChange: "Policy or compliance change required.",
  },
  price_too_low: {
    severity: "long_cooldown",
    days: 180,
    whatWouldChange: "Raise price band via bundling or channel change.",
  },
  price_too_high: {
    severity: "long_cooldown",
    days: 120,
    whatWouldChange: "Lower landed cost or validate premium demand.",
  },
  price_high: {
    severity: "long_cooldown",
    days: 90,
    whatWouldChange: "Negotiate terms to improve landed cost.",
  },
  short_title: {
    severity: "short_cooldown",
    days: 14,
    whatWouldChange: "Provide clearer specs and sourcing evidence.",
  },
  low_signal: {
    severity: "short_cooldown",
    days: 21,
    whatWouldChange: "Add demand proof or stronger source signal.",
  },
};

const NEGATIVE_REASONS = new Set([
  "hazmat_keyword",
  "price_too_low",
  "price_too_high",
  "price_high",
  "short_title",
]);

function addDays(base: Date, days: number): string {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

export function computeRecheckAfter(
  severity: CooldownSeverity,
  daysOverride?: number | null,
): string | null {
  if (severity === "permanent") return null;
  const days =
    daysOverride ?? DEFAULT_POLICY[severity]?.days ?? DEFAULT_POLICY.short_cooldown.days;
  if (!days || days <= 0) return null;
  return addDays(new Date(), days);
}

export function buildCooldownPlan(triage: TriageResult): CooldownPlan {
  const negativeReason = triage.reasons.find((reason) =>
    NEGATIVE_REASONS.has(reason),
  );
  const reasonCode = negativeReason ?? (triage.hardReject ? "policy_blocked" : "low_signal");
  const policy = REASON_POLICIES[reasonCode] ?? DEFAULT_POLICY.short_cooldown;

  return {
    reasonCode,
    severity: policy.severity,
    recheckAfter: computeRecheckAfter(policy.severity, policy.days),
    whatWouldChange: policy.whatWouldChange,
  };
}

export function isCooldownActive(
  severity: string | null | undefined,
  recheckAfter: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!severity) return false;
  if (severity === "permanent") return true;
  if (!recheckAfter) return true;
  const time = Date.parse(recheckAfter);
  if (Number.isNaN(time)) return true;
  return time > now.getTime();
}
