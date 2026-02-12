import {
  normalizeScenarioCategory,
  type ScenarioCategory,
} from "../utils/template-ranker.js";

export type ReviewTier = "standard" | "mandatory-review" | "owner-alert";

type EscalationTier = "NONE" | "HIGH" | "CRITICAL";

type EscalationInput = {
  tier: EscalationTier;
  triggers?: string[];
  confidence?: number;
};

type IntentInput = {
  questions: Array<{ text: string }>;
  requests?: Array<{ text: string }>;
};

export type PolicyActionPlanInput = {
  normalized_text: string;
  scenario: { category: string };
  escalation?: EscalationInput;
  intents?: IntentInput;
};

export type PolicyDecision = {
  mandatoryContent: string[];
  prohibitedContent: string[];
  toneConstraints: string[];
  reviewTier: ReviewTier;
  templateConstraints: {
    allowedCategories?: ScenarioCategory[];
  };
};

const NON_REFUNDABLE_POLICY_STATEMENT =
  "As this is a non-refundable booking, we are unable to offer a refund under the booking terms.";

const REFUNDABLE_CANCELLATION_STATEMENT =
  "If your booking is refundable, we can guide you through the cancellation steps.";

const DISPUTE_REVIEW_STATEMENT =
  "We understand your concern and we are reviewing this with priority.";

const SECURE_PAYMENT_STATEMENT =
  "Please complete any payment updates through our secure payment process only.";

function compactUnique(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function buildSearchText(actionPlan: PolicyActionPlanInput): string {
  const questionText = actionPlan.intents?.questions?.map((item) => item.text).join(" ") ?? "";
  const requestText = actionPlan.intents?.requests?.map((item) => item.text).join(" ") ?? "";
  return `${actionPlan.normalized_text} ${questionText} ${requestText}`.toLowerCase();
}

function isNonRefundableContext(text: string): boolean {
  return /(non[- ]?refundable|pre[- ]?paid[^.]{0,50}non[- ]?refundable|no refund)/.test(text);
}

function isRefundableContext(text: string): boolean {
  return /(refundable|free cancellation|can cancel)/.test(text) && !isNonRefundableContext(text);
}

function isDisputeContext(text: string): boolean {
  return /(disput|chargeback|complaint|legal|refund request|unacceptable|issue)/.test(text);
}

function resolveToneConstraints(category: ScenarioCategory): string[] {
  switch (category) {
    case "cancellation":
      return ["professional", "empathetic", "firm"];
    case "payment":
    case "prepayment":
      return ["professional", "clear", "firm"];
    default:
      return ["professional", "clear"];
  }
}

function resolveTemplateConstraints(
  category: ScenarioCategory
): { allowedCategories?: ScenarioCategory[] } {
  switch (category) {
    case "cancellation":
      return {
        allowedCategories: ["cancellation", "prepayment", "booking-issues"],
      };
    case "payment":
      return {
        allowedCategories: ["payment", "prepayment", "booking-issues"],
      };
    case "prepayment":
      return {
        allowedCategories: ["prepayment", "payment"],
      };
    default:
      return {};
  }
}

function resolveReviewTier(escalationTier: EscalationTier): ReviewTier {
  if (escalationTier === "CRITICAL") {
    return "owner-alert";
  }
  if (escalationTier === "HIGH") {
    return "mandatory-review";
  }
  return "standard";
}

export function evaluatePolicy(actionPlan: PolicyActionPlanInput): PolicyDecision {
  const category = normalizeScenarioCategory(actionPlan.scenario.category) ?? "general";
  const escalationTier = actionPlan.escalation?.tier ?? "NONE";
  const text = buildSearchText(actionPlan);

  const mandatoryContent: string[] = [];
  const prohibitedContent: string[] = [];
  const toneConstraints = resolveToneConstraints(category);
  const templateConstraints = resolveTemplateConstraints(category);

  if (category === "cancellation") {
    if (isNonRefundableContext(text)) {
      mandatoryContent.push(NON_REFUNDABLE_POLICY_STATEMENT);
      prohibitedContent.push(
        "we will refund",
        "full refund",
        "we can make an exception",
        "goodwill refund"
      );
    } else if (isRefundableContext(text)) {
      mandatoryContent.push(REFUNDABLE_CANCELLATION_STATEMENT);
    }
  }

  if (category === "payment" || category === "prepayment") {
    mandatoryContent.push(SECURE_PAYMENT_STATEMENT);
  }

  if (escalationTier === "HIGH" || escalationTier === "CRITICAL" || isDisputeContext(text)) {
    mandatoryContent.push(DISPUTE_REVIEW_STATEMENT);
  }

  return {
    mandatoryContent: compactUnique(mandatoryContent),
    prohibitedContent: compactUnique(prohibitedContent),
    toneConstraints: compactUnique(toneConstraints),
    reviewTier: resolveReviewTier(escalationTier),
    templateConstraints,
  };
}

export default evaluatePolicy;
