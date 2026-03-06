import "server-only";

import { type EmailActionPlan } from "./action-plan";
import {
  evaluateQuestionCoverage,
  extractQuestionKeywords,
  type QuestionCoverageEntry,
} from "./coverage";
import { getEmailTemplates } from "./data.server";
import { detectLanguage } from "./interpret-thread";
import { type PolicyDecision } from "./policy-decision";
import { normalizeScenarioCategory } from "./template-ranker";

export type QualityCheckInput = {
  actionPlan: Pick<
    EmailActionPlan,
    "language" | "intents" | "workflow_triggers" | "scenario" | "scenarios" | "actionPlanVersion"
  > &
    Partial<Pick<EmailActionPlan, "thread_summary">>;
  draft: {
    bodyPlain: string;
    bodyHtml?: string;
  };
  policyDecision?: PolicyDecision;
};

export type QualityCheckResult = {
  passed: boolean;
  failed_checks: string[];
  warnings: string[];
  confidence: number;
  question_coverage: QuestionCoverageEntry[];
};

type CategoryReferencePolicy = {
  requiresReference: boolean;
  canonicalUrls: string[];
};

const BOOKING_ACTION_REFERENCE_HOSTS = new Set<string>([
  "hostelworld.com",
  "www.hostelworld.com",
]);

const STRICT_REFERENCE_CATEGORIES = new Set<string>([
  "cancellation",
  "prepayment",
  "payment",
  "policies",
  "booking-changes",
  "booking-issues",
]);

let categoryReferencePolicyCache: Map<string, CategoryReferencePolicy> | null = null;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function scenarioTarget(category: string): { min: number; max: number } {
  const normalizedCategory = normalizeScenarioCategory(category) ?? "general";

  switch (normalizedCategory) {
    case "faq":
    case "check-in":
    case "breakfast":
    case "luggage":
    case "wifi":
    case "checkout":
    case "access":
    case "transportation":
      return { min: 50, max: 100 };
    case "policies":
    case "payment":
      return { min: 100, max: 150 };
    case "cancellation":
    case "booking-changes":
    case "booking-issues":
    case "prepayment":
      return { min: 80, max: 140 };
    case "house-rules":
      return { min: 80, max: 120 };
    case "promotions":
      return { min: 40, max: 80 };
    case "employment":
    case "lost-found":
    case "activities":
      return { min: 60, max: 120 };
    default:
      return { min: 80, max: 140 };
  }
}

function containsProhibitedClaims(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("availability confirmed") ||
    lower.includes("we will charge now") ||
    lower.includes("we have charged") ||
    lower.includes("card will be charged now")
  );
}

function hasSignature(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("hostel brikette") ||
    lower.includes("brikette") ||
    lower.includes("regards") ||
    lower.includes("team")
  );
}

function hasHtmlSignatureBlock(html?: string): boolean {
  if (!html) {
    return false;
  }
  const lower = html.toLowerCase();
  return (
    lower.includes("cristiana's signature") ||
    lower.includes("peter's signature") ||
    lower.includes("cristiana marzano cowling") ||
    lower.includes("peter cowling")
  );
}

function hasLink(text: string): boolean {
  return /(https?:\/\/\S+)/i.test(text);
}

function extractLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  return matches.map((url) => url.replace(/[.,;:!?]+$/g, ""));
}

function normalizeUrlForMatch(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/g, "");
}

function parseHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function loadCategoryReferencePolicy(): Map<string, CategoryReferencePolicy> {
  if (categoryReferencePolicyCache) {
    return categoryReferencePolicyCache;
  }

  const grouped = new Map<string, { requiresReference: boolean; canonicalUrls: Set<string> }>();
  for (const template of getEmailTemplates()) {
    const normalizedCategory =
      normalizeScenarioCategory(template.category) ?? template.category.toLowerCase();
    const existing = grouped.get(normalizedCategory) ?? {
      requiresReference: false,
      canonicalUrls: new Set<string>(),
    };

    if (template.reference_scope === "reference_required") {
      existing.requiresReference = true;
      if (template.canonical_reference_url) {
        existing.canonicalUrls.add(normalizeUrlForMatch(template.canonical_reference_url));
      }
    }

    grouped.set(normalizedCategory, existing);
  }

  categoryReferencePolicyCache = new Map<string, CategoryReferencePolicy>();
  for (const [category, policy] of grouped.entries()) {
    categoryReferencePolicyCache.set(category, {
      requiresReference: policy.requiresReference,
      canonicalUrls: Array.from(policy.canonicalUrls),
    });
  }

  return categoryReferencePolicyCache;
}

function resolveScenarioCategories(actionPlan: QualityCheckInput["actionPlan"]): string[] {
  const categories =
    actionPlan.actionPlanVersion === "1.1.0" && actionPlan.scenarios && actionPlan.scenarios.length > 0
      ? actionPlan.scenarios.map((scenario) => scenario.category)
      : [actionPlan.scenario.category];

  return Array.from(
    new Set(
      categories.map((category) => normalizeScenarioCategory(category) ?? category.toLowerCase()),
    ),
  );
}

function requiresReferenceForActionPlan(
  actionPlan: QualityCheckInput["actionPlan"],
): { requiresReference: boolean; canonicalUrls: string[] } {
  const policyByCategory = loadCategoryReferencePolicy();
  const categories = resolveScenarioCategories(actionPlan);
  const bookingActionRequired = actionPlan.workflow_triggers.booking_action_required;
  let requiresReference = false;
  const canonicalUrls = new Set<string>();

  for (const category of categories) {
    if (category === "faq" || category === "general") {
      continue;
    }
    if (!bookingActionRequired && !STRICT_REFERENCE_CATEGORIES.has(category)) {
      continue;
    }

    const policy = policyByCategory.get(category);
    if (!policy) {
      continue;
    }
    if (policy.requiresReference) {
      requiresReference = true;
    }
    for (const url of policy.canonicalUrls) {
      canonicalUrls.add(url);
    }
  }

  return { requiresReference, canonicalUrls: Array.from(canonicalUrls) };
}

function hasApplicableReference(
  links: string[],
  canonicalUrls: string[],
  allowBookingMonitorLinks: boolean,
): boolean {
  for (const rawLink of links) {
    const normalizedLink = normalizeUrlForMatch(rawLink);

    if (
      canonicalUrls.some(
        (canonicalUrl) =>
          normalizedLink === canonicalUrl ||
          normalizedLink.startsWith(`${canonicalUrl}/`) ||
          normalizedLink.startsWith(`${canonicalUrl}?`),
      )
    ) {
      return true;
    }

    if (allowBookingMonitorLinks) {
      const hostname = parseHostname(normalizedLink);
      if (hostname && BOOKING_ACTION_REFERENCE_HOSTS.has(hostname)) {
        return true;
      }
    }
  }

  return false;
}

function contradictsCommitments(body: string, commitments: string[]): boolean {
  const lower = body.toLowerCase();
  const contradictionCues = [
    "cannot provide",
    "can't provide",
    "unable to provide",
    "unable to arrange",
    "cannot arrange",
    "not available",
    "not possible",
  ];

  for (const commitment of commitments) {
    const keywords = extractQuestionKeywords(commitment);
    for (const keyword of keywords) {
      if (
        lower.includes(`${keyword} is not available`) ||
        lower.includes(`${keyword} are not available`) ||
        lower.includes(`${keyword} was not available`)
      ) {
        return true;
      }

      if (lower.includes(keyword) && contradictionCues.some((cue) => lower.includes(cue))) {
        return true;
      }
    }
  }

  return false;
}

function includesNormalizedPhrase(bodyLower: string, phrase: string): boolean {
  const normalizedPhrase = phrase.toLowerCase().replace(/\s+/g, " ").trim();
  return normalizedPhrase.length > 0 && bodyLower.includes(normalizedPhrase);
}

function hasMissingPolicyMandatoryContent(
  body: string,
  policyDecision: PolicyDecision,
): boolean {
  const lower = body.toLowerCase().replace(/\s+/g, " ");
  return policyDecision.mandatoryContent.some((phrase) => !includesNormalizedPhrase(lower, phrase));
}

function hasPolicyProhibitedContent(
  body: string,
  policyDecision: PolicyDecision,
): boolean {
  const lower = body.toLowerCase().replace(/\s+/g, " ");
  return policyDecision.prohibitedContent.some((phrase) => includesNormalizedPhrase(lower, phrase));
}

export function runQualityChecks(input: QualityCheckInput): QualityCheckResult {
  const { actionPlan, draft, policyDecision } = input;
  const failed_checks: string[] = [];
  const warnings: string[] = [];

  const allIntents = [...actionPlan.intents.questions, ...actionPlan.intents.requests];
  const question_coverage = evaluateQuestionCoverage(draft.bodyPlain, allIntents);
  if (question_coverage.some((entry) => entry.status === "missing")) {
    failed_checks.push("unanswered_questions");
  }
  if (question_coverage.some((entry) => entry.status === "partial")) {
    warnings.push("partial_question_coverage");
  }

  if (containsProhibitedClaims(draft.bodyPlain)) {
    failed_checks.push("prohibited_claims");
  }
  if (!draft.bodyPlain.trim()) {
    failed_checks.push("missing_plaintext");
  }
  if (!draft.bodyHtml?.trim()) {
    failed_checks.push("missing_html");
  }
  if (!hasSignature(draft.bodyPlain) && !hasHtmlSignatureBlock(draft.bodyHtml)) {
    failed_checks.push("missing_signature");
  }

  const draftText = `${draft.bodyPlain} ${draft.bodyHtml ?? ""}`;
  const draftLinks = extractLinks(draftText);
  if (actionPlan.workflow_triggers.booking_action_required && !hasLink(draftText)) {
    failed_checks.push("missing_required_link");
  }

  const referencePolicy = requiresReferenceForActionPlan(actionPlan);
  if (referencePolicy.requiresReference) {
    if (draftLinks.length === 0) {
      failed_checks.push("missing_required_reference");
    } else if (
      !hasApplicableReference(
        draftLinks,
        referencePolicy.canonicalUrls,
        actionPlan.workflow_triggers.booking_action_required,
      )
    ) {
      failed_checks.push("reference_not_applicable");
    }
  }

  if (actionPlan.thread_summary?.prior_commitments?.length) {
    if (contradictsCommitments(draft.bodyPlain, actionPlan.thread_summary.prior_commitments)) {
      failed_checks.push("contradicts_thread");
    }
  }

  if (policyDecision) {
    if (policyDecision.mandatoryContent.length > 0 && hasMissingPolicyMandatoryContent(draft.bodyPlain, policyDecision)) {
      failed_checks.push("missing_policy_mandatory_content");
    }
    if (policyDecision.prohibitedContent.length > 0 && hasPolicyProhibitedContent(draft.bodyPlain, policyDecision)) {
      failed_checks.push("policy_prohibited_content");
    }
  }

  const draftLanguage = detectLanguage(draft.bodyPlain);
  if (actionPlan.language !== "UNKNOWN" && draftLanguage !== actionPlan.language) {
    warnings.push("language_mismatch");
  }

  const primaryScenarioCategory =
    actionPlan.actionPlanVersion === "1.1.0" && actionPlan.scenarios && actionPlan.scenarios.length > 0
      ? actionPlan.scenarios[0].category
      : actionPlan.scenario.category;
  const target = scenarioTarget(primaryScenarioCategory);
  const count = wordCount(draft.bodyPlain);
  if (count < target.min * 0.8 || count > target.max * 1.2) {
    warnings.push("length_out_of_range");
  }

  const policyRuleCheckCount =
    policyDecision &&
    (policyDecision.mandatoryContent.length > 0 || policyDecision.prohibitedContent.length > 0)
      ? 2
      : 0;
  const totalChecks = 6 + policyRuleCheckCount;
  const confidence = Math.max(0, Math.min(1, (totalChecks - failed_checks.length) / totalChecks));

  return {
    passed: failed_checks.length === 0,
    failed_checks,
    warnings,
    confidence,
    question_coverage,
  };
}
