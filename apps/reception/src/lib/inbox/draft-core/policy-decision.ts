import { type EmailActionPlan, type ScenarioCategory } from "./action-plan";
import { normalizeScenarioCategory } from "./template-ranker";

export type ReviewTier = "standard" | "mandatory-review" | "owner-alert";

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
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildSearchText(actionPlan: Pick<EmailActionPlan, "normalized_text" | "intents">): string {
  const questionText = actionPlan.intents.questions.map((item) => item.text).join(" ");
  const requestText = actionPlan.intents.requests.map((item) => item.text).join(" ");
  return `${actionPlan.normalized_text} ${questionText} ${requestText}`.toLowerCase();
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

function resolveTemplateConstraints(category: ScenarioCategory): { allowedCategories?: ScenarioCategory[] } {
  switch (category) {
    case "cancellation":
      return { allowedCategories: ["cancellation", "prepayment", "booking-issues"] };
    case "payment":
      return { allowedCategories: ["payment", "prepayment", "booking-issues"] };
    case "prepayment":
      return { allowedCategories: ["prepayment", "payment"] };
    default:
      return {};
  }
}

export function evaluatePolicy(actionPlan: Pick<EmailActionPlan, "normalized_text" | "scenario" | "escalation" | "intents">): PolicyDecision {
  const category = normalizeScenarioCategory(actionPlan.scenario.category) ?? "general";
  const escalationTier = actionPlan.escalation.tier;
  const text = buildSearchText(actionPlan);

  const mandatoryContent: string[] = [];
  const prohibitedContent: string[] = [];
  if (category === "cancellation") {
    if (/(non[- ]?refundable|pre[- ]?paid[^.]{0,50}non[- ]?refundable|no refund)/.test(text)) {
      mandatoryContent.push(NON_REFUNDABLE_POLICY_STATEMENT);
      prohibitedContent.push("we will refund", "full refund", "we can make an exception", "goodwill refund");
    } else if (/(refundable|free cancellation|can cancel)/.test(text)) {
      mandatoryContent.push(REFUNDABLE_CANCELLATION_STATEMENT);
    }
  }
  if (category === "payment" || category === "prepayment") {
    mandatoryContent.push(SECURE_PAYMENT_STATEMENT);
  }
  if (
    escalationTier === "HIGH" ||
    escalationTier === "CRITICAL" ||
    /(disput|chargeback|complaint|legal|refund request|unacceptable|issue)/.test(text)
  ) {
    mandatoryContent.push(DISPUTE_REVIEW_STATEMENT);
  }

  return {
    mandatoryContent: compactUnique(mandatoryContent),
    prohibitedContent: compactUnique(prohibitedContent),
    toneConstraints: compactUnique(resolveToneConstraints(category)),
    reviewTier:
      escalationTier === "CRITICAL"
        ? "owner-alert"
        : escalationTier === "HIGH"
          ? "mandatory-review"
          : "standard",
    templateConstraints: resolveTemplateConstraints(category),
  };
}
