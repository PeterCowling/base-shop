// TASK-01 (v2): draft_refine — attestation layer for LLM-refined email drafts.
//
// Claude (CLI) performs the refinement and submits refinedBodyPlain.
// This tool validates quality, attests the result, and derives bodyHtml.
// No Anthropic API calls — fully deterministic.

import { join } from "path";
import { z } from "zod";

import { generateEmailHtml } from "../utils/email-template.js";
import { redactPii } from "../utils/pii-redact.js";
import {
  appendJsonlEvent,
  editDistancePct,
  type RewriteReason,
} from "../utils/signal-events.js";
import { errorResult, formatError, jsonResult } from "../utils/validation.js";

import { handleDraftQualityTool } from "./draft-quality-check.js";

// ---------------------------------------------------------------------------
// Hard-rule protected categories
// See: .claude/skills/ops-inbox/SKILL.md — "Hard rules" section
// These categories contain legally/operationally sensitive template text
// that must never be modified during refinement.
// ---------------------------------------------------------------------------

export const PROTECTED_CATEGORIES = ["prepayment", "cancellation"] as const;

// TASK-02: path to signal events JSONL — writes are best-effort.
const SIGNAL_EVENTS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "draft-signal-events.jsonl",
);

export const REWRITE_REASONS: RewriteReason[] = [
  "none",
  "style",
  "language-adapt",
  "light-edit",
  "heavy-rewrite",
  "missing-info",
  "wrong-template",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RefinementSource = "claude-cli" | "codex" | "none";
type RefinementMode = "auto" | "external" | "deterministic_only" | "auto_best";

type QualityGateResult = {
  passed: boolean;
  failed_checks: string[];
  warnings: string[];
};

type RefineResult = {
  draft: { bodyPlain: string; bodyHtml: string };
  refinement_applied: boolean;
  refinement_source: RefinementSource;
  quality: QualityGateResult;
};

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const draftRefineSchema = z.object({
  actionPlan: z.object({
    language: z.enum(["EN", "IT", "ES", "UNKNOWN"]),
    intents: z.object({
      questions: z.array(z.object({ text: z.string() })).default([]),
      requests: z.array(z.object({ text: z.string() })).optional().default([]),
    }),
    scenario: z.object({
      category: z.string().min(1),
    }),
    workflow_triggers: z.object({
      booking_action_required: z.boolean().optional().default(false),
      booking_context: z.boolean().optional().default(false),
    }),
  }),
  // TASK-02: required; links this refinement event to the selection event from draft_generate.
  draft_id: z.string().min(1),
  // TASK-02: optional; populated by the refinement actor (Claude CLI). Defaults to "none".
  rewrite_reason: z
    .enum([
      "none",
      "style",
      "language-adapt",
      "light-edit",
      "heavy-rewrite",
      "missing-info",
      "wrong-template",
    ] as const)
    .optional()
    .default("none"),
  refinement_mode: z
    .enum(["auto", "external", "deterministic_only", "auto_best"] as const)
    .optional()
    .default("auto_best"),
  originalBodyPlain: z.string().min(1),
  refinedBodyPlain: z.string().min(1).optional(),
  context: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const draftRefineTools = [
  {
    name: "draft_refine",
    description:
      "Attestation layer for LLM-refined email drafts. Claude (CLI) performs the refinement and submits refinedBodyPlain; this tool validates quality, attests the result, and derives bodyHtml. No API calls — fully deterministic.",
    inputSchema: {
      type: "object",
      properties: {
        actionPlan: {
          type: "object",
          description: "EmailActionPlan from draft_interpret",
        },
        originalBodyPlain: {
          type: "string",
          description: "The original unrefined draft body (plain text)",
        },
        refinedBodyPlain: {
          type: "string",
          description: "The refined body produced by Claude (CLI)",
        },
        refinement_mode: {
          type: "string",
          enum: ["auto", "external", "deterministic_only", "auto_best"],
          description: "Refinement execution mode. auto_best compares deterministic and external candidates and prefers deterministic when not worse.",
        },
        draft_id: {
          type: "string",
          description: "The draft_id returned by draft_generate — links this refinement to the selection event",
        },
        rewrite_reason: {
          type: "string",
          enum: ["none", "style", "language-adapt", "light-edit", "heavy-rewrite", "missing-info", "wrong-template"],
          description: "Why Claude rewrote the draft. Pass 'none' when refinedBodyPlain === originalBodyPlain.",
        },
        context: {
          type: "string",
          description: "Optional additional context",
        },
      },
      required: ["actionPlan", "draft_id", "originalBodyPlain"],
    },
  },
] as const;

function hasSignatureLikeText(text: string): boolean {
  return /(best regards|kind regards|warm regards|hostel brikette|brikette team)/i.test(text);
}

function normalizeCandidateText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function buildDeterministicRefinement(
  originalBodyPlain: string,
  category: string,
): string {
  if (
    PROTECTED_CATEGORIES.includes(
      category as (typeof PROTECTED_CATEGORIES)[number],
    )
  ) {
    return originalBodyPlain;
  }

  const normalized = normalizeCandidateText(originalBodyPlain);

  if (hasSignatureLikeText(normalized)) {
    return normalized;
  }

  return `${normalized}\n\nBest regards,\nHostel Brikette`;
}

async function evaluateDraft(
  actionPlan: unknown,
  bodyPlain: string,
): Promise<{ bodyHtml: string; quality: QualityGateResult }> {
  const bodyHtml = generateEmailHtml({ bodyText: bodyPlain });
  const quality = await runQualityGate(actionPlan, bodyPlain, bodyHtml);
  return { bodyHtml, quality };
}

function shouldFallbackToBaseline(
  baseline: QualityGateResult,
  candidate: QualityGateResult,
): boolean {
  if (baseline.passed && !candidate.passed) {
    return true;
  }
  return candidate.failed_checks.length > baseline.failed_checks.length;
}

function isCandidateWorse(
  candidate: QualityGateResult,
  reference: QualityGateResult,
): boolean {
  if (reference.passed && !candidate.passed) {
    return true;
  }
  return candidate.failed_checks.length > reference.failed_checks.length;
}

function inferRewriteReason(
  provided: RewriteReason,
  originalBodyPlain: string,
  candidateBodyPlain: string,
): RewriteReason {
  if (provided !== "none") {
    return provided;
  }

  const distance = editDistancePct(originalBodyPlain, candidateBodyPlain);
  if (distance === 0) {
    return "none";
  }
  if (distance <= 0.08) {
    return "style";
  }
  if (distance <= 0.25) {
    return "light-edit";
  }
  return "heavy-rewrite";
}

function repairMissingSignature(
  bodyPlain: string,
  category: string,
): string {
  if (
    PROTECTED_CATEGORIES.includes(
      category as (typeof PROTECTED_CATEGORIES)[number],
    )
  ) {
    return bodyPlain;
  }

  const normalized = normalizeCandidateText(bodyPlain);
  if (hasSignatureLikeText(normalized)) {
    return normalized;
  }

  return `${normalized}\n\nBest regards,\nHostel Brikette`;
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  return Array.from(
    new Set(matches.map((url) => url.replace(/[.,;:!?]+$/g, ""))),
  );
}

function repairMissingLinks(
  candidateBodyPlain: string,
  originalBodyPlain: string,
  category: string,
): string {
  if (
    PROTECTED_CATEGORIES.includes(
      category as (typeof PROTECTED_CATEGORIES)[number],
    )
  ) {
    return candidateBodyPlain;
  }

  const candidateLinks = new Set(extractUrls(candidateBodyPlain));
  const originalLinks = extractUrls(originalBodyPlain);
  const missingLinks = originalLinks.filter((url) => !candidateLinks.has(url));
  if (missingLinks.length === 0) {
    return candidateBodyPlain;
  }

  const normalized = normalizeCandidateText(candidateBodyPlain);
  const linkBlock = missingLinks.map((url) => `- ${url}`).join("\n");
  return `${normalized}\n\nReference links:\n${linkBlock}`;
}

function tokenizeQuestionTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function repairUnansweredQuestions(
  candidateBodyPlain: string,
  originalBodyPlain: string,
  category: string,
  questions: Array<{ text: string }>,
): string {
  if (
    PROTECTED_CATEGORIES.includes(
      category as (typeof PROTECTED_CATEGORIES)[number],
    )
  ) {
    return candidateBodyPlain;
  }

  const questionTerms = Array.from(
    new Set(questions.flatMap((question) => tokenizeQuestionTerms(question.text))),
  );
  if (questionTerms.length === 0) {
    return candidateBodyPlain;
  }

  const candidateLower = candidateBodyPlain.toLowerCase();
  const supplemental = splitSentences(originalBodyPlain)
    .filter((sentence) => {
      const sentenceLower = sentence.toLowerCase();
      return (
        questionTerms.some((term) => sentenceLower.includes(term)) &&
        !candidateLower.includes(sentenceLower)
      );
    })
    .slice(0, 2);

  if (supplemental.length === 0) {
    return candidateBodyPlain;
  }

  const normalizedCandidate = normalizeCandidateText(candidateBodyPlain);
  return normalizeCandidateText(
    `${normalizedCandidate}\n\n${supplemental.join(" ")}`
  );
}

function repairProhibitedClaims(
  candidateBodyPlain: string,
  category: string,
): string {
  if (
    PROTECTED_CATEGORIES.includes(
      category as (typeof PROTECTED_CATEGORIES)[number],
    )
  ) {
    return candidateBodyPlain;
  }

  let repaired = candidateBodyPlain;
  const replacements: Array<[RegExp, string]> = [
    [/\bavailability confirmed\b/gi, "availability can be checked on request"],
    [/\bwe will charge now\b/gi, "we can share secure payment options if needed"],
    [/\bwe have charged\b/gi, "a payment may be required according to policy"],
    [/\bcard will be charged now\b/gi, "card details may be required according to policy"],
  ];

  for (const [pattern, replacement] of replacements) {
    repaired = repaired.replace(pattern, replacement);
  }

  return normalizeCandidateText(repaired);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleDraftRefineTool(name: string, args: unknown) {
  if (name !== "draft_refine") {
    return errorResult(`Unknown draft refine tool: ${name}`);
  }

  // Old-schema guard: v1 callers passed a `draft` object; v2 requires originalBodyPlain + refinedBodyPlain
  if (
    args !== null &&
    typeof args === "object" &&
    "draft" in args &&
    !("refinedBodyPlain" in args)
  ) {
    return errorResult(
      "draft_refine input schema has changed: remove the `draft` field and supply `originalBodyPlain: string` + `refinedBodyPlain: string` instead.",
    );
  }

  const parsed = draftRefineSchema.safeParse(args);
  if (!parsed.success) {
    return errorResult(`Invalid arguments: ${formatError(parsed.error)}`);
  }

  const {
    actionPlan,
    draft_id,
    rewrite_reason,
    refinement_mode,
    originalBodyPlain,
    refinedBodyPlain,
  } = parsed.data;
  let protectedAdjustedRefinedBodyPlain = refinedBodyPlain;

  const effectiveMode: RefinementMode =
    refinement_mode === "auto"
      ? refinedBodyPlain
        ? "external"
        : "deterministic_only"
      : refinement_mode;
  let deterministicAttempted =
    effectiveMode === "deterministic_only" || effectiveMode === "auto_best";

  if (effectiveMode === "external" && !refinedBodyPlain) {
    return errorResult(
      "Invalid arguments: refinedBodyPlain is required when refinement_mode is external.",
    );
  }

  if (
    PROTECTED_CATEGORIES.includes(
      actionPlan.scenario.category as (typeof PROTECTED_CATEGORIES)[number],
    ) &&
    refinedBodyPlain &&
    refinedBodyPlain.trim() !== originalBodyPlain.trim()
  ) {
    // Fail-safe for protected categories: enforce original text instead of failing hard.
    protectedAdjustedRefinedBodyPlain = originalBodyPlain;
  }

  let candidateBodyPlain =
    effectiveMode === "deterministic_only"
      ? buildDeterministicRefinement(
          originalBodyPlain,
          actionPlan.scenario.category,
        )
      : normalizeCandidateText(protectedAdjustedRefinedBodyPlain as string);
  let refinementSource: RefinementSource =
    effectiveMode === "deterministic_only" ? "codex" : "claude-cli";

  if (effectiveMode === "auto_best") {
    const deterministicBody = buildDeterministicRefinement(
      originalBodyPlain,
      actionPlan.scenario.category,
    );

    const deterministicResult = await evaluateDraft(actionPlan, deterministicBody);
    const externalBody = normalizeCandidateText(
      protectedAdjustedRefinedBodyPlain ?? originalBodyPlain,
    );
    const externalResult = await evaluateDraft(actionPlan, externalBody);

    if (!isCandidateWorse(deterministicResult.quality, externalResult.quality)) {
      candidateBodyPlain = deterministicBody;
      refinementSource = "codex";
    } else {
      candidateBodyPlain = externalBody;
      refinementSource = "claude-cli";
    }
  }

  // Hard-rule guard: protected categories must not have their text modified.
  // See: .claude/skills/ops-inbox/SKILL.md — "Hard rules" section
  const dominantCategory = actionPlan.scenario.category;
  if (
    PROTECTED_CATEGORIES.includes(
      dominantCategory as (typeof PROTECTED_CATEGORIES)[number],
    ) &&
    candidateBodyPlain.trim() !== originalBodyPlain.trim()
  ) {
    candidateBodyPlain = originalBodyPlain;
  }

  const emittedRewriteReason = inferRewriteReason(
    rewrite_reason,
    originalBodyPlain,
    candidateBodyPlain,
  );

  // Identity check: refinement was a no-op
  if (candidateBodyPlain.trim() === originalBodyPlain.trim()) {
    const { bodyHtml, quality } = await evaluateDraft(actionPlan, originalBodyPlain);
    // TASK-02: write refinement event — best-effort.
    appendJsonlEvent(SIGNAL_EVENTS_PATH, {
      event: "refinement",
      draft_id,
      ts: new Date().toISOString(),
      rewrite_reason: emittedRewriteReason,
      refinement_applied: false,
      refinement_source: "none",
      refinement_mode: refinementSource === "codex" ? "deterministic_only" : "external",
      refinement_strategy: effectiveMode,
      deterministic_attempted: deterministicAttempted,
      quality_passed: quality.passed,
      quality_failed_checks_count: quality.failed_checks.length,
      parity_fallback: false,
      edit_distance_pct: 0,
    }).catch(() => {});
    const result: RefineResult = {
      draft: { bodyPlain: originalBodyPlain, bodyHtml },
      refinement_applied: false,
      refinement_source: "none",
      quality,
    };
    return jsonResult(result);
  }

  let candidateResult = await evaluateDraft(actionPlan, candidateBodyPlain);
  if (candidateResult.quality.failed_checks.includes("missing_signature")) {
    const repairedBody = repairMissingSignature(
      candidateBodyPlain,
      actionPlan.scenario.category,
    );
    if (repairedBody !== candidateBodyPlain) {
      const repairedResult = await evaluateDraft(actionPlan, repairedBody);
      if (!isCandidateWorse(repairedResult.quality, candidateResult.quality)) {
        candidateBodyPlain = repairedBody;
        candidateResult = repairedResult;
        deterministicAttempted = true;
      }
    }
  }
  if (
    candidateResult.quality.failed_checks.includes("missing_required_link") ||
    candidateResult.quality.failed_checks.includes("missing_required_reference") ||
    candidateResult.quality.failed_checks.includes("reference_not_applicable")
  ) {
    const repairedBody = repairMissingLinks(
      candidateBodyPlain,
      originalBodyPlain,
      actionPlan.scenario.category,
    );
    if (repairedBody !== candidateBodyPlain) {
      const repairedResult = await evaluateDraft(actionPlan, repairedBody);
      if (!isCandidateWorse(repairedResult.quality, candidateResult.quality)) {
        candidateBodyPlain = repairedBody;
        candidateResult = repairedResult;
        deterministicAttempted = true;
      }
    }
  }
  if (candidateResult.quality.failed_checks.includes("unanswered_questions")) {
    const repairedBody = repairUnansweredQuestions(
      candidateBodyPlain,
      originalBodyPlain,
      actionPlan.scenario.category,
      actionPlan.intents.questions,
    );
    if (repairedBody !== candidateBodyPlain) {
      const repairedResult = await evaluateDraft(actionPlan, repairedBody);
      if (!isCandidateWorse(repairedResult.quality, candidateResult.quality)) {
        candidateBodyPlain = repairedBody;
        candidateResult = repairedResult;
        deterministicAttempted = true;
      }
    }
  }
  if (
    candidateResult.quality.failed_checks.includes("prohibited_claims") ||
    candidateResult.quality.failed_checks.includes("policy_prohibited_content")
  ) {
    const repairedBody = repairProhibitedClaims(
      candidateBodyPlain,
      actionPlan.scenario.category,
    );
    if (repairedBody !== candidateBodyPlain) {
      const repairedResult = await evaluateDraft(actionPlan, repairedBody);
      if (!isCandidateWorse(repairedResult.quality, candidateResult.quality)) {
        candidateBodyPlain = repairedBody;
        candidateResult = repairedResult;
        deterministicAttempted = true;
      }
    }
  }
  const baselineResult = await evaluateDraft(actionPlan, originalBodyPlain);

  if (shouldFallbackToBaseline(baselineResult.quality, candidateResult.quality)) {
    appendJsonlEvent(SIGNAL_EVENTS_PATH, {
      event: "refinement",
      draft_id,
      ts: new Date().toISOString(),
      rewrite_reason: emittedRewriteReason,
      refinement_applied: false,
      refinement_source: "none",
      refinement_mode: refinementSource === "codex" ? "deterministic_only" : "external",
      refinement_strategy: effectiveMode,
      deterministic_attempted: deterministicAttempted,
      quality_passed: baselineResult.quality.passed,
      quality_failed_checks_count: baselineResult.quality.failed_checks.length,
      parity_fallback: true,
      edit_distance_pct: 0,
    }).catch(() => {});

    return jsonResult({
      draft: {
        bodyPlain: originalBodyPlain,
        bodyHtml: baselineResult.bodyHtml,
      },
      refinement_applied: false,
      refinement_source: "none",
      quality: baselineResult.quality,
    } satisfies RefineResult);
  }

  // TASK-02: write refinement event — best-effort.
  // TASK-04: include refined_body_redacted for proposal generation.
  appendJsonlEvent(SIGNAL_EVENTS_PATH, {
    event: "refinement",
    draft_id,
    ts: new Date().toISOString(),
    rewrite_reason: emittedRewriteReason,
    refinement_applied: true,
    refinement_source: refinementSource,
    refinement_mode: refinementSource === "codex" ? "deterministic_only" : "external",
    refinement_strategy: effectiveMode,
    deterministic_attempted: deterministicAttempted,
    quality_passed: candidateResult.quality.passed,
    quality_failed_checks_count: candidateResult.quality.failed_checks.length,
    parity_fallback: false,
    edit_distance_pct: editDistancePct(originalBodyPlain, candidateBodyPlain),
    refined_body_redacted: redactPii(candidateBodyPlain),
  }).catch(() => {});

  const result: RefineResult = {
    draft: {
      bodyPlain: candidateBodyPlain,
      bodyHtml: candidateResult.bodyHtml,
    },
    refinement_applied: true,
    refinement_source: refinementSource,
    quality: candidateResult.quality,
  };

  return jsonResult(result);
}

// ---------------------------------------------------------------------------
// Internal quality gate — delegates to draft_quality_check handler
// ---------------------------------------------------------------------------

async function runQualityGate(
  actionPlan: unknown,
  bodyPlain: string,
  bodyHtml: string,
): Promise<QualityGateResult> {
  const qualityResponse = await handleDraftQualityTool("draft_quality_check", {
    actionPlan,
    draft: { bodyPlain, bodyHtml },
  });

  const response = qualityResponse as {
    isError?: boolean;
    content?: Array<{ text?: string }>;
  };
  const rawText = response.content?.[0]?.text;
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    return {
      passed: false,
      failed_checks: ["quality_gate_parse_error"],
      warnings: ["quality_gate_empty_response"],
    };
  }

  if (response.isError === true) {
    return {
      passed: false,
      failed_checks: ["quality_gate_error"],
      warnings: [],
    };
  }

  try {
    const qualityData = JSON.parse(rawText) as {
      passed: boolean;
      failed_checks: string[];
      warnings: string[];
    };
    if (
      typeof qualityData.passed !== "boolean" ||
      !Array.isArray(qualityData.failed_checks) ||
      !Array.isArray(qualityData.warnings)
    ) {
      return {
        passed: false,
        failed_checks: ["quality_gate_parse_error"],
        warnings: ["quality_gate_invalid_shape"],
      };
    }
    return {
      passed: qualityData.passed,
      failed_checks: qualityData.failed_checks,
      warnings: qualityData.warnings,
    };
  } catch {
    // Quality gate parse failure: fail closed
    return {
      passed: false,
      failed_checks: ["quality_gate_parse_error"],
      warnings: [],
    };
  }
}
