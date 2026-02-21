import type { BicRisk } from "./bic.js";

type RiskInput = {
  role?: string;
  name?: string;
  nearText?: string;
};

const DANGER_PATTERNS: ReadonlyArray<RegExp> = [
  /\bpay\b/i,
  /\bplace\s+order\b/i,
  /\bsubmit\s+payment\b/i,
  /\bconfirm\b/i,
  /\bdelete\b/i,
  /\bremove\b/i,
  /\bpublish\b/i,
  /\bmerge\b/i,
  /\brefund\b/i,
];

function normalize(text?: string): string {
  return (text ?? "").trim().toLowerCase();
}

function matchesAny(text: string, patterns: ReadonlyArray<RegExp>): boolean {
  if (!text) {
    return false;
  }
  return patterns.some((pattern) => pattern.test(text));
}

export function classifyAffordanceRisk(input: RiskInput): BicRisk {
  const name = normalize(input.name);
  const nearText = normalize(input.nearText);

  // Conservative: prefer false positives (gating safe actions) over false negatives.
  if (matchesAny(name, DANGER_PATTERNS) || matchesAny(nearText, DANGER_PATTERNS)) {
    return "danger";
  }

  // Default v0.1: safe unless we know it is dangerous.
  return "safe";
}

