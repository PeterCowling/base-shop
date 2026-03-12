/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-102 internal operator copy, English-only tool [ttl=2026-06-30] */

/**
 * Business-wide benefit taxonomy — controlled vocabulary for operator-facing
 * benefit copy. All benefit output must be derived from one of these categories;
 * no freeform copy generation is allowed.
 */
export type BusinessBenefitCategory =
  | "conversion_reliability"
  | "customer_trust"
  | "delivery_speed"
  | "risk_reduction"
  | "team_capacity"
  | "clarity"
  | "unknown";

export interface EvidenceLabel {
  /** Short human-readable label for display in collapsed evidence affordance. */
  label: string;
  /** The raw evidence reference text, for trust and audit. */
  raw: string;
}

export interface DecisionBrief {
  /** One-sentence problem statement suitable for a non-technical reader. */
  problem: string;
  /** Why this matters now — urgency, priority, or business consequence. */
  whyNow: string;
  /** Business-wide benefit expected if acted on. Always from controlled taxonomy. */
  businessBenefit: string;
  /** Taxonomy category used to derive businessBenefit. */
  benefitCategory: BusinessBenefitCategory;
  /** What happens immediately after pressing Do. From explicit route/status mapping. */
  expectedNextStep: string;
  /** Plain-language confidence explanation. Present only when confidence is available. */
  confidenceExplainer?: string;
  /** Labeled evidence summaries for the collapsed evidence/details affordance. */
  evidenceLabels: EvidenceLabel[];
}

export interface DecisionBriefInput {
  areaAnchor?: string;
  why?: string;
  title: string;
  priority?: string;
  confidence?: number;
  recommendedRoute?: string;
  evidenceRefs?: string[];
  locationAnchors?: string[];
}

const BENEFIT_COPY: Record<BusinessBenefitCategory, string> = {
  conversion_reliability:
    "Fixing this unblocks purchases and improves the rate at which visitors complete checkout.",
  customer_trust:
    "Resolving this strengthens customer confidence in the product and brand.",
  delivery_speed:
    "Completing this reduces the cycle time between decisions and shipped improvements.",
  risk_reduction:
    "Acting on this reduces the risk of broken behaviour, data errors, or customer-facing failures.",
  team_capacity:
    "Completing this removes recurring manual overhead and frees capacity for higher-value work.",
  clarity:
    "Resolving this removes ambiguity that slows decisions and increases the risk of misaligned work.",
  unknown:
    "Completing this work moves the idea forward and reduces the active backlog.",
};

const ROUTE_NEXT_STEP: Record<string, string> = {
  "lp-do-build": "Work starts immediately once you approve.",
  "lp-do-fact-find":
    "A scoped investigation runs first to map out the work.",
  "lp-do-plan":
    "A plan is drafted and reviewed before work starts.",
  "lp-do-briefing":
    "A briefing document is prepared for review before work starts.",
  "lp-do-analysis":
    "An analysis runs first to surface the data before any changes are made.",
  "lp-do-replan":
    "The existing plan is revisited and adjusted before work continues.",
  "lp-do-critique":
    "The current proposal is reviewed for issues before proceeding.",
};

function classifyBenefitCategory(
  input: DecisionBriefInput
): BusinessBenefitCategory {
  const evidenceRefs = input.evidenceRefs ?? [];
  const combinedText =
    ((input.why ?? "") + " " + (input.areaAnchor ?? "")).toLowerCase();

  // 1. Security/auth/data-contracts coverage hint
  const securityHintRe = /coverage-hint:\s*(security|auth|data-contracts)/i;
  if (evidenceRefs.some((ref) => securityHintRe.test(ref))) {
    return "risk_reduction";
  }

  // 2. Broken + commerce signals together
  const brokenSignals = [
    "block",
    "broken",
    "fail",
    "disabled",
    "error",
    "crash",
    "wrong",
    "incorrect",
    "missing",
  ];
  const commerceSignals = [
    "customer",
    "buy",
    "cart",
    "checkout",
    "price",
    "payment",
    "purchase",
    "order",
  ];
  const hasBroken = brokenSignals.some((s) => combinedText.includes(s));
  const hasCommerce = commerceSignals.some((s) => combinedText.includes(s));
  if (hasBroken && hasCommerce) {
    return "conversion_reliability";
  }

  // 3. Pure commerce signals
  const conversionSignals = [
    "cart",
    "checkout",
    "buy",
    "purchase",
    "conversion",
    "price",
  ];
  if (conversionSignals.some((s) => combinedText.includes(s))) {
    return "conversion_reliability";
  }

  // 4. Pure broken signals
  const riskSignals = [
    "block",
    "broken",
    "fail",
    "disabled",
    "error",
    "crash",
  ];
  if (riskSignals.some((s) => combinedText.includes(s))) {
    return "risk_reduction";
  }

  // 5. Trust signals
  const trustSignals = ["trust", "confidence", "credibility", "reputation"];
  if (trustSignals.some((s) => combinedText.includes(s))) {
    return "customer_trust";
  }

  // 6. Speed/performance signals
  const speedSignals = [
    "speed",
    "fast",
    "slow",
    "performance",
    "latency",
    "cycle time",
  ];
  if (speedSignals.some((s) => combinedText.includes(s))) {
    return "delivery_speed";
  }

  // 7. Capacity/automation signals
  const capacitySignals = ["capacity", "overhead", "manual", "automat"];
  if (capacitySignals.some((s) => combinedText.includes(s))) {
    return "team_capacity";
  }

  // 8. Clarity signals
  const claritySignals = [
    "unclear",
    "confus",
    "ambiguous",
    "understand",
    "readable",
    "jargon",
  ];
  if (claritySignals.some((s) => combinedText.includes(s))) {
    return "clarity";
  }

  // 9. P1 fallback
  if (input.priority === "P1") {
    return "risk_reduction";
  }

  // 10. P2 fallback
  if (input.priority === "P2") {
    return "clarity";
  }

  return "unknown";
}

function buildProblem(input: DecisionBriefInput): string {
  if (input.areaAnchor && input.areaAnchor.trim().length > 0) {
    return input.areaAnchor.trim();
  }

  if (input.why && input.why.trim().length > 0) {
    // First sentence: split on ". " or "\n"
    const firstSentence = input.why.split(/\. |\n/)[0];
    if (firstSentence && firstSentence.trim().length > 0) {
      return firstSentence.trim();
    }
  }

  return input.title.trim();
}

function buildWhyNow(input: DecisionBriefInput): string {
  if (input.why && input.why.trim().length > 0) {
    return input.why.trim();
  }

  if (input.priority) {
    return `Priority: ${input.priority}.`;
  }

  return "No urgency context available.";
}

function buildExpectedNextStep(recommendedRoute: string | undefined): string {
  if (recommendedRoute && recommendedRoute in ROUTE_NEXT_STEP) {
    return ROUTE_NEXT_STEP[recommendedRoute];
  }

  return "Work is handed to the routing flow for next steps.";
}

function buildConfidenceExplainer(
  confidence: number | undefined
): string | undefined {
  if (typeof confidence !== "number") {
    return undefined;
  }

  if (confidence >= 0.9) {
    return "Very high confidence — the evidence is clear and the outcome is well-defined.";
  }

  if (confidence >= 0.8) {
    return "High confidence — the analysis is solid and the outcome is likely.";
  }

  if (confidence >= 0.7) {
    return "Moderate confidence — the direction is clear but some details may shift during work.";
  }

  if (confidence >= 0.5) {
    return "Some uncertainty — the approach is sound but the scope may evolve.";
  }

  return "Lower confidence — more investigation may be needed before work starts.";
}

function buildEvidenceLabels(
  evidenceRefs: string[] | undefined,
  locationAnchors: string[] | undefined
): EvidenceLabel[] {
  const labels: EvidenceLabel[] = [];

  for (const ref of evidenceRefs ?? []) {
    if (!ref || ref.trim().length === 0) {
      continue;
    }

    if (ref.startsWith("operator-stated:")) {
      labels.push({ label: "Operator observation", raw: ref });
      continue;
    }

    const coverageMatch = ref.match(/^coverage-hint:\s*(.+)/i);
    if (coverageMatch) {
      const hintName = coverageMatch[1].trim();
      const capitalized =
        hintName.charAt(0).toUpperCase() + hintName.slice(1);
      labels.push({ label: `Coverage: ${capitalized}`, raw: ref });
      continue;
    }

    if (/^observation:/i.test(ref)) {
      labels.push({ label: "System observation", raw: ref });
      continue;
    }

    labels.push({ label: "Evidence", raw: ref });
  }

  for (const anchor of locationAnchors ?? []) {
    if (!anchor || anchor.trim().length === 0) {
      continue;
    }

    labels.push({ label: "File", raw: anchor });
  }

  return labels;
}

export function projectDecisionBrief(input: DecisionBriefInput): DecisionBrief {
  const benefitCategory = classifyBenefitCategory(input);
  const businessBenefit = BENEFIT_COPY[benefitCategory];

  return {
    problem: buildProblem(input),
    whyNow: buildWhyNow(input),
    businessBenefit,
    benefitCategory,
    expectedNextStep: buildExpectedNextStep(input.recommendedRoute),
    confidenceExplainer: buildConfidenceExplainer(input.confidence),
    evidenceLabels: buildEvidenceLabels(
      input.evidenceRefs,
      input.locationAnchors
    ),
  };
}
