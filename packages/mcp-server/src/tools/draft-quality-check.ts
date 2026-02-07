import { z } from "zod";

import { errorResult, formatError, jsonResult } from "../utils/validation.js";

type QualityResult = {
  passed: boolean;
  failed_checks: string[];
  warnings: string[];
  confidence: number;
};

type EmailActionPlanInput = {
  language: "EN" | "IT" | "ES" | "UNKNOWN";
  intents: {
    questions: Array<{ text: string }>; 
  };
  workflow_triggers: {
    booking_monitor: boolean;
  };
  scenario: {
    category: string;
  };
  thread_summary?: {
    prior_commitments: string[];
  };
};

type DraftCandidateInput = {
  bodyPlain: string;
  bodyHtml?: string;
};

const qualityCheckSchema = z.object({
  actionPlan: z.object({
    language: z.enum(["EN", "IT", "ES", "UNKNOWN"]),
    intents: z.object({
      questions: z.array(z.object({ text: z.string().min(1) })).default([]),
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
  switch (category) {
    case "faq":
      return { min: 50, max: 100 };
    case "policy":
    case "payment":
      return { min: 100, max: 150 };
    case "cancellation":
      return { min: 80, max: 140 };
    case "complaint":
      return { min: 120, max: 180 };
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
    lower.includes("best regards")
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

function extractQuestionKeywords(question: string): string[] {
  return question
    .replace(/\?/g, "")
    .split(/\s+/)
    .map(word => word.toLowerCase())
    .filter(word => word.length > 3)
    .slice(0, 3);
}

function answersQuestions(body: string, questions: Array<{ text: string }>): boolean {
  const lower = body.toLowerCase();
  return questions.every(question => {
    const keywords = extractQuestionKeywords(question.text);
    if (keywords.length === 0) {
      return true;
    }
    return keywords.some(keyword => lower.includes(keyword));
  });
}

function contradictsCommitments(body: string, commitments: string[]): boolean {
  const lower = body.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);
  for (const commitment of commitments) {
    const words = commitment.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    for (const word of words) {
      for (let i = 0; i < tokens.length; i += 1) {
        if (tokens[i] === "not") {
          if (tokens[i + 1] === word || tokens[i + 2] === word) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function runChecks(actionPlan: EmailActionPlanInput, draft: DraftCandidateInput): QualityResult {
  const failed_checks: string[] = [];
  const warnings: string[] = [];

  if (!answersQuestions(draft.bodyPlain, actionPlan.intents.questions)) {
    failed_checks.push("unanswered_questions");
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

  if (!hasSignature(draft.bodyPlain)) {
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

  const draftLanguage = detectLanguage(draft.bodyPlain);
  if (actionPlan.language !== "UNKNOWN" && draftLanguage !== actionPlan.language) {
    warnings.push("language_mismatch");
  }

  const target = scenarioTarget(actionPlan.scenario.category);
  const count = wordCount(draft.bodyPlain);
  if (count < target.min * 0.8 || count > target.max * 1.2) {
    warnings.push("length_out_of_range");
  }

  const totalChecks = 6;
  const confidence = Math.max(0, Math.min(1, (totalChecks - failed_checks.length) / totalChecks));

  return {
    passed: failed_checks.length === 0,
    failed_checks,
    warnings,
    confidence,
  };
}

export async function handleDraftQualityTool(name: string, args: unknown) {
  if (name !== "draft_quality_check") {
    return errorResult(`Unknown draft quality tool: ${name}`);
  }

  try {
    const { actionPlan, draft } = qualityCheckSchema.parse(args);
    const result = runChecks(actionPlan, draft);
    return jsonResult(result);
  } catch (error) {
    return errorResult(formatError(error));
  }
}

export default handleDraftQualityTool;
