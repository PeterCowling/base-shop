import "server-only";

import type { EmailActionPlan, ThreadContext as MessageThreadContext } from "./draft-core/action-plan";
import { extractRecipientName } from "./draft-core/email-template";
import {
  type DraftGenerationResult,
  generateDraftCandidate,
} from "./draft-core/generate";
import { interpretDraftMessage } from "./draft-core/interpret";
import {
  type QualityCheckResult,
  runQualityChecks,
} from "./draft-core/quality-check";
import type {
  PrepaymentProvider,
  PrepaymentStep,
} from "./draft-core/template-ranker";

export type ThreadContext = {
  from?: string;
  subject?: string;
  body?: string;
  threadContext?: MessageThreadContext;
  prepaymentStep?: PrepaymentStep;
  prepaymentProvider?: PrepaymentProvider;
  guestName?: string;
  guestRoomNumbers?: string[];
};

export type AgentDraftResult = {
  status: "ready" | "needs_follow_up" | "error";
  plainText: string | null;
  html: string | null;
  draftId: string | null;
  templateUsed: DraftGenerationResult["templateUsed"] | null;
  qualityResult: QualityCheckResult | null;
  interpretResult: Pick<
    EmailActionPlan,
    "language" | "intents" | "scenario" | "scenarios" | "escalation" | "thread_summary"
  > | null;
  questionBlocks: DraftGenerationResult["questionBlocks"];
  knowledgeSources: string[];
  error?: {
    code: "invalid_input";
    message: string;
  };
};

export type AgentDraftParitySnapshot = {
  interpreted_language: string | null;
  dominant_scenario_category: string | null;
  selected_template_subject: string | null;
  selected_template_category: string | null;
  answered_question_set: string[];
  quality_result: {
    passed: boolean;
    failed_checks: string[];
    warnings: string[];
  } | null;
  branded_html_present: boolean;
};

export type DraftFailureReason = {
  code: string;
  message: string;
};

const FAILED_CHECK_LABELS: Record<string, string> = {
  unanswered_questions: "unanswered questions",
  prohibited_claims: "prohibited claims",
  missing_plaintext: "missing plain text",
  missing_html: "missing HTML",
  missing_signature: "missing signature",
  missing_required_link: "missing required link",
  missing_required_reference: "missing required reference",
  reference_not_applicable: "inapplicable reference",
  contradicts_thread: "contradicts prior thread",
  missing_policy_mandatory_content: "missing policy content",
  policy_prohibited_content: "prohibited policy content",
};

function formatFailedChecks(failedChecks: string[]): string {
  if (failedChecks.length === 0) {
    return "";
  }

  const labels = failedChecks
    .map((check) => FAILED_CHECK_LABELS[check] ?? check.replace(/_/g, " "))
    .slice(0, 3);

  return labels.join(", ");
}

/**
 * Derives a staff-facing failure reason from an `AgentDraftResult`.
 * Used by sync and recovery pipelines when draft generation fails.
 */
export function deriveDraftFailureReason(draftResult: AgentDraftResult): DraftFailureReason {
  if (draftResult.status === "error") {
    if (draftResult.error?.code === "invalid_input") {
      return {
        code: "invalid_input",
        message: "The email had no body text to generate a reply from.",
      };
    }

    return {
      code: "generation_failed",
      message: "Draft generation failed unexpectedly.",
    };
  }

  if (draftResult.qualityResult && !draftResult.qualityResult.passed) {
    const checks = formatFailedChecks(draftResult.qualityResult.failed_checks);
    return {
      code: "quality_gate_failed",
      message: checks
        ? `Draft did not pass quality checks: ${checks}.`
        : "Draft did not pass quality checks.",
    };
  }

  return {
    code: "generation_failed",
    message: "Draft generation failed unexpectedly.",
  };
}

/**
 * Creates a failure reason from a standalone code string.
 * Used by recovery pipeline for cases like max_retries_exceeded
 * where no AgentDraftResult is available.
 */
export function draftFailureReasonFromCode(code: string, message?: string): DraftFailureReason {
  const defaultMessages: Record<string, string> = {
    max_retries_exceeded: "Draft generation failed after multiple retry attempts.",
    generation_failed: "Draft generation failed unexpectedly.",
  };

  return {
    code,
    message: message ?? defaultMessages[code] ?? "Draft generation failed.",
  };
}

function buildInvalidInputResult(): AgentDraftResult {
  return {
    status: "error",
    plainText: null,
    html: null,
    draftId: null,
    templateUsed: null,
    qualityResult: null,
    interpretResult: null,
    questionBlocks: [],
    knowledgeSources: [],
    error: {
      code: "invalid_input",
      message: "Draft pipeline requires a non-empty body.",
    },
  };
}

function extractCoveredQuestionSet(
  intents: EmailActionPlan["intents"],
  qualityResult: QualityCheckResult,
): string[] {
  const allQuestionTexts = new Set(
    [...intents.questions, ...intents.requests]
      .map((intent) => intent.text.trim())
      .filter(Boolean),
  );

  if (allQuestionTexts.size === 0) {
    return [];
  }

  return qualityResult.question_coverage
    .filter((entry) => entry.status !== "missing")
    .map((entry) => entry.question.trim())
    .filter((question, index, questions) => question.length > 0 && questions.indexOf(question) === index);
}

function hasBrandedHtml(html: string | null): boolean {
  if (!html) {
    return false;
  }

  return html.includes("Cristiana's Signature") && html.includes("Peter's Signature");
}

export function toParitySnapshot(result: AgentDraftResult): AgentDraftParitySnapshot {
  return {
    interpreted_language: result.interpretResult?.language ?? null,
    dominant_scenario_category: result.interpretResult?.scenarios?.[0]?.category
      ?? result.interpretResult?.scenario.category
      ?? null,
    selected_template_subject: result.templateUsed?.subject ?? null,
    selected_template_category: result.templateUsed?.category ?? null,
    answered_question_set:
      result.interpretResult && result.qualityResult
        ? extractCoveredQuestionSet(result.interpretResult.intents, result.qualityResult)
        : [],
    quality_result: result.qualityResult
      ? {
          passed: result.qualityResult.passed,
          failed_checks: result.qualityResult.failed_checks,
          warnings: result.qualityResult.warnings,
        }
      : null,
    branded_html_present: hasBrandedHtml(result.html),
  };
}

export async function generateAgentDraft(threadContext: ThreadContext): Promise<AgentDraftResult> {
  const body = typeof threadContext.body === "string" ? threadContext.body.trim() : "";
  if (!body) {
    return buildInvalidInputResult();
  }

  const interpretResult = interpretDraftMessage({
    body,
    subject: threadContext.subject,
    threadContext: threadContext.threadContext,
  });

  const generationResult = generateDraftCandidate({
    actionPlan: interpretResult,
    subject: threadContext.subject,
    recipientName: threadContext.guestName ?? (threadContext.from ? extractRecipientName(threadContext.from) : undefined),
    prepaymentStep: threadContext.prepaymentStep,
    prepaymentProvider: threadContext.prepaymentProvider,
    guestRoomNumbers: threadContext.guestRoomNumbers,
  });

  const qualityResult = runQualityChecks({
    actionPlan: interpretResult,
    draft: generationResult.draft,
    policyDecision: generationResult.policy,
  });

  return {
    status: generationResult.deliveryStatus,
    plainText: generationResult.draft.bodyPlain,
    html: generationResult.draft.bodyHtml,
    draftId: generationResult.draftId,
    templateUsed: generationResult.templateUsed,
    qualityResult,
    interpretResult: {
      language: interpretResult.language,
      intents: interpretResult.intents,
      scenario: interpretResult.scenario,
      scenarios: interpretResult.scenarios,
      escalation: interpretResult.escalation,
      thread_summary: interpretResult.thread_summary,
    },
    questionBlocks: generationResult.questionBlocks,
    knowledgeSources: generationResult.knowledgeSources,
  };
}
