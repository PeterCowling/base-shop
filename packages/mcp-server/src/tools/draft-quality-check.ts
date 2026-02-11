import { z } from "zod";

import { stemmedTokenizer } from "@acme/lib";

import {
  normalizeScenarioCategory,
  type ScenarioCategory,
  SYNONYMS,
} from "../utils/template-ranker.js";
import { errorResult, formatError, jsonResult } from "../utils/validation.js";


function tokenize(text: string): string[] {
  return stemmedTokenizer.tokenize(text);
}

type QualityResult = {
  passed: boolean;
  failed_checks: string[];
  warnings: string[];
  confidence: number;
  question_coverage: QuestionCoverageEntry[];
};

type QuestionCoverageEntry = {
  question: string;
  matched_count: number;
  required_matches: number;
  coverage_score: number;
  status: "covered" | "partial" | "missing";
};

type EmailActionPlanInput = {
  language: "EN" | "IT" | "ES" | "UNKNOWN";
  intents: {
    questions: Array<{ text: string }>;
    requests?: Array<{ text: string }>;
  };
  workflow_triggers: {
    booking_monitor: boolean;
  };
  scenario: {
    category: ScenarioCategory | string;
  };
  thread_summary?: {
    prior_commitments: string[];
  };
};

type DraftCandidateInput = {
  bodyPlain: string;
  bodyHtml?: string;
};

type PolicyDecisionInput = {
  mandatoryContent: string[];
  prohibitedContent: string[];
  reviewTier?: "standard" | "mandatory-review" | "owner-alert";
  toneConstraints: string[];
  templateConstraints?: {
    allowedCategories?: string[];
  };
};

const qualityCheckSchema = z.object({
  actionPlan: z.object({
    language: z.enum(["EN", "IT", "ES", "UNKNOWN"]),
    intents: z.object({
      questions: z.array(z.object({ text: z.string().min(1) })).default([]),
      requests: z.array(z.object({ text: z.string().min(1) })).default([]),
    }),
    workflow_triggers: z.object({
      booking_monitor: z.boolean().optional().default(false),
    }),
    scenario: z.object({
      category: z.string().min(1),
    }),
    thread_summary: z
      .object({
        prior_commitments: z.array(z.string()).default([]),
      })
      .optional(),
  }),
  draft: z.object({
    bodyPlain: z.string().min(1),
    bodyHtml: z.string().optional(),
  }),
  policyDecision: z
    .object({
      mandatoryContent: z.array(z.string()).default([]),
      prohibitedContent: z.array(z.string()).default([]),
      reviewTier: z.enum(["standard", "mandatory-review", "owner-alert"]).optional(),
      toneConstraints: z.array(z.string()).default([]),
      templateConstraints: z
        .object({
          allowedCategories: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const draftQualityTools = [
  {
    name: "draft_quality_check",
    description: "Run quality checks on a draft candidate using an EmailActionPlan.",
    inputSchema: {
      type: "object",
      properties: {
        actionPlan: { type: "object", description: "EmailActionPlan JSON" },
        draft: { type: "object", description: "DraftCandidate with plain+HTML" },
      },
      required: ["actionPlan", "draft"],
    },
  },
] as const;

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

function detectLanguage(text: string): "EN" | "IT" | "ES" | "UNKNOWN" {
  const lower = text.toLowerCase();
  if (/(\bciao\b|\bgrazie\b|\bbuongiorno\b|\bper favore\b)/.test(lower)) {
    return "IT";
  }
  if (/(\bhola\b|\bgracias\b|\bpor favor\b)/.test(lower)) {
    return "ES";
  }
  if (/[a-z]/i.test(lower)) {
    return "EN";
  }
  return "UNKNOWN";
}

function hasLink(text: string): boolean {
  return /(https?:\/\/\S+)/i.test(text);
}

const STOP_WORDS = new Set([
  "that", "this", "from", "with", "what", "when", "where", "which",
  "have", "does", "will", "would", "could", "should", "there", "their",
  "they", "them", "been", "being", "also", "just", "about", "than",
  "your", "some", "each", "were", "more", "very",
]);

function extractQuestionKeywords(question: string): string[] {
  return question
    .replace(/\?/g, "")
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 5);
}

function evaluateQuestionCoverage(
  body: string,
  questions: Array<{ text: string }>
): QuestionCoverageEntry[] {
  const bodyTokens = tokenize(body.toLowerCase());
  const bodySet = new Set(bodyTokens);

  return questions.map((question) => {
    const keywords = extractQuestionKeywords(question.text);
    if (keywords.length === 0) {
      return {
        question: question.text,
        matched_count: 0,
        required_matches: 0,
        coverage_score: 1,
        status: "covered",
      };
    }

    const matchedKeywords: string[] = [];
    for (const keyword of keywords) {
      const variants = [keyword, ...(SYNONYMS[keyword] ?? [])];
      const matched = variants.some((variant) => {
        const stems = tokenize(variant.toLowerCase());
        return stems.some((stem) => bodySet.has(stem));
      });
      if (matched) {
        matchedKeywords.push(keyword);
      }
    }

    const required_matches = keywords.length >= 2 ? 2 : 1;
    const matched_count = matchedKeywords.length;
    const coverage_score = Number((matched_count / keywords.length).toFixed(2));
    const status =
      matched_count === 0
        ? "missing"
        : matched_count < required_matches
          ? "partial"
          : "covered";

    return {
      question: question.text,
      matched_count,
      required_matches,
      coverage_score,
      status,
    };
  });
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

      if (!lower.includes(keyword)) {
        continue;
      }

      if (contradictionCues.some((cue) => lower.includes(cue))) {
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
  policyDecision: PolicyDecisionInput
): boolean {
  const lower = body.toLowerCase().replace(/\s+/g, " ");
  return policyDecision.mandatoryContent.some(
    (phrase) => !includesNormalizedPhrase(lower, phrase)
  );
}

function hasPolicyProhibitedContent(
  body: string,
  policyDecision: PolicyDecisionInput
): boolean {
  const lower = body.toLowerCase().replace(/\s+/g, " ");
  return policyDecision.prohibitedContent.some((phrase) =>
    includesNormalizedPhrase(lower, phrase)
  );
}

function runChecks(
  actionPlan: EmailActionPlanInput,
  draft: DraftCandidateInput,
  policyDecision?: PolicyDecisionInput
): QualityResult {
  const failed_checks: string[] = [];
  const warnings: string[] = [];

  const allIntents = [
    ...actionPlan.intents.questions,
    ...(actionPlan.intents.requests ?? []),
  ];
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

  if (!draft.bodyPlain || !draft.bodyPlain.trim()) {
    failed_checks.push("missing_plaintext");
  }
  if (!draft.bodyHtml || !draft.bodyHtml.trim()) {
    failed_checks.push("missing_html");
  }

  if (!hasSignature(draft.bodyPlain) && !hasHtmlSignatureBlock(draft.bodyHtml)) {
    failed_checks.push("missing_signature");
  }

  if (actionPlan.workflow_triggers.booking_monitor && !hasLink(draft.bodyPlain + " " + (draft.bodyHtml ?? ""))) {
    failed_checks.push("missing_required_link");
  }

  if (actionPlan.thread_summary?.prior_commitments?.length) {
    if (contradictsCommitments(draft.bodyPlain, actionPlan.thread_summary.prior_commitments)) {
      failed_checks.push("contradicts_thread");
    }
  }

  if (policyDecision) {
    if (
      policyDecision.mandatoryContent.length > 0 &&
      hasMissingPolicyMandatoryContent(draft.bodyPlain, policyDecision)
    ) {
      failed_checks.push("missing_policy_mandatory_content");
    }
    if (
      policyDecision.prohibitedContent.length > 0 &&
      hasPolicyProhibitedContent(draft.bodyPlain, policyDecision)
    ) {
      failed_checks.push("policy_prohibited_content");
    }
  }

  const draftLanguage = detectLanguage(draft.bodyPlain);
  if (actionPlan.language !== "UNKNOWN" && draftLanguage !== actionPlan.language) {
    warnings.push("language_mismatch");
  }

  const target = scenarioTarget(actionPlan.scenario.category);
  const count = wordCount(draft.bodyPlain);
  if (count < target.min * 0.8 || count > target.max * 1.2) {
    warnings.push("length_out_of_range");
  }

  const policyRuleCheckCount = policyDecision &&
    (policyDecision.mandatoryContent.length > 0 ||
      policyDecision.prohibitedContent.length > 0)
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

export async function handleDraftQualityTool(name: string, args: unknown) {
  if (name !== "draft_quality_check") {
    return errorResult(`Unknown draft quality tool: ${name}`);
  }

  try {
    const { actionPlan, draft, policyDecision } = qualityCheckSchema.parse(args);
    const result = runChecks(actionPlan, draft, policyDecision);
    return jsonResult(result);
  } catch (error) {
    return errorResult(formatError(error));
  }
}

export default handleDraftQualityTool;
