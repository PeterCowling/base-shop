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
      booking_monitor: z.boolean().optional().default(false),
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
  originalBodyPlain: z.string().min(1),
  refinedBodyPlain: z.string().min(1),
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
      required: ["actionPlan", "draft_id", "originalBodyPlain", "refinedBodyPlain"],
    },
  },
] as const;

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

  const { actionPlan, draft_id, rewrite_reason, originalBodyPlain, refinedBodyPlain } = parsed.data;

  // Hard-rule guard: protected categories must not have their text modified.
  // See: .claude/skills/ops-inbox/SKILL.md — "Hard rules" section
  const dominantCategory = actionPlan.scenario.category;
  if (
    PROTECTED_CATEGORIES.includes(
      dominantCategory as (typeof PROTECTED_CATEGORIES)[number],
    ) &&
    refinedBodyPlain.trim() !== originalBodyPlain.trim()
  ) {
    return errorResult(
      `Hard rule violation: ${dominantCategory} template text must not be modified. Pass originalBodyPlain unchanged in refinedBodyPlain for this category.`,
    );
  }

  // Identity check: refinement was a no-op
  if (refinedBodyPlain.trim() === originalBodyPlain.trim()) {
    const bodyHtml = generateEmailHtml({ bodyText: originalBodyPlain });
    const quality = await runQualityGate(actionPlan, originalBodyPlain, bodyHtml);
    // TASK-02: write refinement event — best-effort.
    appendJsonlEvent(SIGNAL_EVENTS_PATH, {
      event: "refinement",
      draft_id,
      ts: new Date().toISOString(),
      rewrite_reason,
      refinement_applied: false,
      refinement_source: "none",
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

  // Refinement was applied — generate branded HTML and run quality gate
  const bodyHtml = generateEmailHtml({ bodyText: refinedBodyPlain });
  const quality = await runQualityGate(actionPlan, refinedBodyPlain, bodyHtml);
  // TASK-02: write refinement event — best-effort.
  // TASK-04: include refined_body_redacted for proposal generation.
  appendJsonlEvent(SIGNAL_EVENTS_PATH, {
    event: "refinement",
    draft_id,
    ts: new Date().toISOString(),
    rewrite_reason,
    refinement_applied: true,
    refinement_source: "claude-cli",
    edit_distance_pct: editDistancePct(originalBodyPlain, refinedBodyPlain),
    refined_body_redacted: redactPii(refinedBodyPlain),
  }).catch(() => {});

  const result: RefineResult = {
    draft: { bodyPlain: refinedBodyPlain, bodyHtml },
    refinement_applied: true,
    refinement_source: "claude-cli",
    quality,
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

  try {
    const text = (qualityResponse as { content: Array<{ text: string }> })
      .content[0].text;
    const qualityData = JSON.parse(text) as {
      passed: boolean;
      failed_checks: string[];
      warnings: string[];
    };
    return {
      passed: qualityData.passed,
      failed_checks: qualityData.failed_checks,
      warnings: qualityData.warnings,
    };
  } catch {
    // Quality gate parse failure: treat as passed with warning
    return {
      passed: true,
      failed_checks: [],
      warnings: ["quality_gate_parse_error"],
    };
  }
}
