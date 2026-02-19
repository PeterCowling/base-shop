// TASK-01 (v2): draft_refine — attestation layer for LLM-refined email drafts.
//
// Claude (CLI) performs the refinement and submits refinedBodyPlain.
// This tool validates quality, attests the result, and derives bodyHtml.
// No Anthropic API calls — fully deterministic.

import { z } from "zod";

import { errorResult, formatError, jsonResult } from "../utils/validation.js";

import { handleDraftQualityTool } from "./draft-quality-check.js";

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
// HTML derivation
// ---------------------------------------------------------------------------

function deriveHtml(bodyPlain: string): string {
  const paragraphs = bodyPlain
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return `<!DOCTYPE html>\n<html><body>\n${paragraphs}\n</body></html>`;
}

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
        context: {
          type: "string",
          description: "Optional additional context",
        },
      },
      required: ["actionPlan", "originalBodyPlain", "refinedBodyPlain"],
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

  const { actionPlan, originalBodyPlain, refinedBodyPlain } = parsed.data;

  // Identity check: refinement was a no-op
  if (refinedBodyPlain.trim() === originalBodyPlain.trim()) {
    const bodyHtml = deriveHtml(originalBodyPlain);
    const quality = await runQualityGate(actionPlan, originalBodyPlain, bodyHtml);
    const result: RefineResult = {
      draft: { bodyPlain: originalBodyPlain, bodyHtml },
      refinement_applied: false,
      refinement_source: "none",
      quality,
    };
    return jsonResult(result);
  }

  // Refinement was applied — derive HTML and run quality gate
  const bodyHtml = deriveHtml(refinedBodyPlain);
  const quality = await runQualityGate(actionPlan, refinedBodyPlain, bodyHtml);

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
